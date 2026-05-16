import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { SsoDomainConfig } from 'src/app/types';
import { AuthError } from 'firebase/auth';

/**
 * Browser step for the embed SSO handoff: user signs in or links **enterprise SSO only**,
 * then completes the pairing session. Social/email sign-in lives on /join and Profile.
 */
@Component({
  selector: 'app-embed-sso-link',
  standalone: true,
  imports: [
    MatButton,
    MatProgressSpinner,
    RouterLink,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
  ],
  templateUrl: './embed-sso-link.component.html',
  styleUrls: ['./embed-sso-link.component.scss'],
})
export class EmbedSsoLinkComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly user = toSignal(this.authService.user, { initialValue: null });

  pairingId = signal<string | null>(null);
  ssoFromEmailDomain = signal<SsoDomainConfig | null>(null);
  /** Set after user submits work email on this page (no query / signed-in match). */
  ssoFromManualEmail = signal<SsoDomainConfig | null>(null);
  /** From `?providerId=` + `?organizationId=` (handoff from integration after email lookup) */
  ssoFromHandoffQuery = signal<{
    providerId: string;
    organizationId: string;
    organizationName?: string;
  } | null>(null);

  busy = signal(false);
  done = signal(false);
  errorText = signal('');
  pendingSsoAccountExists = signal(false);

  readonly workEmailControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  readonly resolvedFromDomain = computed(() => this.ssoFromEmailDomain());

  readonly resolvedFromHandoffQuery = computed(() => this.ssoFromHandoffQuery());

  readonly activeSso = computed(() => {
    const h = this.resolvedFromHandoffQuery();
    if (h) {
      return {
        providerId: h.providerId,
        organizationId: h.organizationId,
        label: h.organizationName ?? 'your organization',
      };
    }
    const d = this.resolvedFromDomain();
    if (d) {
      return {
        providerId: d.providerId,
        organizationId: d.organizationId,
        label: d.organizationName ?? 'your organization',
      };
    }
    const m = this.ssoFromManualEmail();
    if (m?.providerId) {
      return {
        providerId: m.providerId,
        organizationId: m.organizationId,
        label: m.organizationName ?? 'your organization',
      };
    }
    return null;
  });

  readonly hasEnterpriseProvider = computed(() => {
    const u = this.user();
    const cfg = this.activeSso();
    if (!u || !cfg) {
      return false;
    }
    return u.providerData.some(p => p.providerId === cfg.providerId);
  });

  constructor() {
    effect(() => {
      const u = this.user();
      const email = u?.email;
      if (!email) {
        this.ssoFromEmailDomain.set(null);
        return;
      }
      const domain = email.split('@')[1]?.toLowerCase();
      if (!domain) {
        this.ssoFromEmailDomain.set(null);
        return;
      }
      void this.authService
        .getSsoDomainConfig(domain)
        .then(c => this.ssoFromEmailDomain.set(c));
    });
    effect(() => {
      const email = this.user()?.email;
      if (email && this.workEmailControl.pristine && !this.workEmailControl.value) {
        this.workEmailControl.setValue(email, { emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const pid = q.get('pairingId');
    this.pairingId.set(pid);

    console.info('[ssoLinkPairing] browser tab loaded', { pairingId: pid });

    const providerId = q.get('providerId');
    const organizationId = q.get('organizationId');
    if (providerId?.trim() && organizationId?.trim()) {
      const orgName = q.get('orgName');
      this.ssoFromHandoffQuery.set({
        providerId: providerId.trim(),
        organizationId: organizationId.trim(),
        organizationName: orgName?.trim() || undefined,
      });
    }
  }

  /** Work email on this page: lookup domain SSO, then sign in or link and complete pairing. */
  async continueFromWorkEmail(): Promise<void> {
    this.workEmailControl.markAllAsTouched();
    if (this.workEmailControl.invalid) {
      return;
    }
    const domain = emailDomainFromAddress(this.workEmailControl.value);
    if (!domain) {
      this.workEmailControl.setErrors({
        invalidDomain: true,
      });
      return;
    }

    this.busy.set(true);
    this.errorText.set('');
    this.pendingSsoAccountExists.set(false);
    try {
      const cfg = await this.authService.getSsoDomainConfig(domain);
      if (!cfg?.providerId) {
        this.errorText.set(
          'No work SSO is configured for that email domain. Check the address or contact your admin.'
        );
        return;
      }
      this.ssoFromManualEmail.set(cfg);

      const u = this.user();
      if (!u || u.isAnonymous) {
        await this.authService.signInWithEnterpriseSso(
          cfg.providerId,
          cfg.organizationId
        );
      } else {
        await this.authService.linkEnterpriseSso(
          cfg.providerId,
          cfg.organizationId
        );
      }
      await this.completePairing();
    } catch (e: unknown) {
      const err = e as AuthError;
      const signedOut = !this.user() || this.user()!.isAnonymous;
      if (
        signedOut &&
        err?.code === 'auth/account-exists-with-different-credential'
      ) {
        this.pendingSsoAccountExists.set(true);
        this.errorText.set(
          'This email already uses a different sign-in method.'
        );
      } else {
        this.errorText.set(
          e instanceof Error ? e.message : 'SSO could not be completed'
        );
      }
    } finally {
      this.busy.set(false);
    }
  }

  async signInWithOrgSso(): Promise<void> {
    const cfg = this.activeSso();
    if (!cfg) {
      return;
    }
    this.busy.set(true);
    this.errorText.set('');
    this.pendingSsoAccountExists.set(false);
    try {
      await this.authService.signInWithEnterpriseSso(
        cfg.providerId,
        cfg.organizationId
      );
      await this.completePairing();
    } catch (e: unknown) {
      const err = e as AuthError;
      if (err?.code === 'auth/account-exists-with-different-credential') {
        this.pendingSsoAccountExists.set(true);
        this.errorText.set('This email already has an account.');
      } else {
        this.errorText.set(
          e instanceof Error ? e.message : 'SSO sign-in failed'
        );
      }
    } finally {
      this.busy.set(false);
    }
  }

  async linkWorkSsoAndFinish(): Promise<void> {
    const cfg = this.activeSso();
    if (!cfg) {
      return;
    }
    this.busy.set(true);
    this.errorText.set('');
    try {
      await this.authService.linkEnterpriseSso(
        cfg.providerId,
        cfg.organizationId
      );
      await this.completePairing();
    } catch (e: unknown) {
      this.errorText.set(
        e instanceof Error ? e.message : 'Could not link work SSO'
      );
    } finally {
      this.busy.set(false);
    }
  }

  async completePairingOnly(): Promise<void> {
    this.busy.set(true);
    this.errorText.set('');
    try {
      await this.completePairing();
    } catch (e: unknown) {
      this.errorText.set(
        e instanceof Error ? e.message : 'Could not complete pairing'
      );
    } finally {
      this.busy.set(false);
    }
  }

  private async completePairing(): Promise<void> {
    const pid = this.pairingId();
    if (!pid) {
      throw new Error('Missing pairing');
    }
    console.info('[ssoLinkPairing] browser calling completeSsoLinkPairing', {
      pairingId: pid,
      uid: this.user()?.uid,
    });
    try {
      await this.authService.completeSsoLinkPairingInBrowser(pid);
      console.info('[ssoLinkPairing] browser callable returned ok', {
        pairingId: pid,
      });
    } catch (err) {
      console.error('[ssoLinkPairing] browser callable failed', {
        pairingId: pid,
        err,
      });
      throw err;
    }
    const orgId = this.activeSso()?.organizationId;
    await this.authService.ensureJoinedEnterpriseOrganization(orgId);
    this.done.set(true);
  }
}

function emailDomainFromAddress(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length < 2 || parts[1].length === 0) {
    return null;
  }
  return parts[1];
}
