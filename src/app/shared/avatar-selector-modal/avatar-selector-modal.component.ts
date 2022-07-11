import { Component, OnDestroy, OnInit } from '@angular/core';
import { User } from 'firebase/auth';
import { Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { AnalyticsService } from 'src/app/services/analytics.service';

type Avatar = {
  name: string;
  url: string;
};

const createAvatars = (count: number, seed?: string): Avatar[] => {
  const avatars: Avatar[] = [];
  for (let i = 0; i < count; i++) {
    avatars.push({
      name: `Avatar ${i + 1}`,
      url: `https://avatars.dicebear.com/api/avataaars/${
        seed ?? ''
      }${i}.svg?style=circle&backgroundColor=%23ffffff&mouth=default,smile&eyebrow=default,defaultNatural,flat,flatNatural,raised,raisedExcited,raisedExcitedNatural&eyes=default,roll,eyeRoll,happy,hearts,side,squint,surprised,wink,winkWacky`,
    });
  }
  return avatars;
};
export const AVATAR_SELECTOR_MODAL = 'avatar-selector-modal';
const AVATAR_COUNT = 109;
@Component({
  selector: 'app-avatar-selector-modal',
  templateUrl: './avatar-selector-modal.component.html',
  styleUrls: ['./avatar-selector-modal.component.scss'],
})
export class AvatarSelectorModalComponent implements OnInit, OnDestroy {
  avatars = createAvatars(AVATAR_COUNT);
  user: User | undefined;
  destroy = new Subject<void>();

  constructor(private auth: AuthService, private analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.auth.user.pipe(takeUntil(this.destroy)).subscribe((user) => {
      this.user = user;
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  selectAvatar(avatar: Avatar | null) {
    this.auth.updateAvatar(avatar ? avatar.url : null);
    this.analytics.logSelectedAvatar(avatar?.url ?? 'default');
  }

  randomizeAvatars() {
    this.avatars = createAvatars(AVATAR_COUNT, Math.random().toString());
    this.analytics.logClickedRandomizeAvatars();
  }
}
