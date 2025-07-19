import { Component, inject, Inject, OnInit, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { CookieService } from 'src/app/services/cookie.service';
import { NavigationService } from 'src/app/services/navigation.service';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatAnchor, MatIconButton } from '@angular/material/button';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { ProfileDropdownComponent } from 'src/app/shared/profile-dropdown/profile-dropdown.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'planning-poker-landing-header',
  templateUrl: './header-v2.component.html',
  styleUrls: ['./header-v2.component.scss'],

  imports: [
    NgClass,
    NgOptimizedImage,
    MatButton,
    MatIcon,
    RouterLink,
    RouterLinkActive,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatAnchor,
    MatIconButton,
    ProfileDropdownComponent,
  ],
})
export class HeaderV2Component implements OnInit {
  isOpen = false;
  menuOpen = false;
  openDropdown: 'features' | 'integrations' | null = null;
  dropdownHoverTimer: any = null;
  dropdownLeaveTimer: any = null;
  
  // Mobile submenu state
  mobileSubmenuOpen: 'resources' | null = null;

  isEmbeddedApp = this.config.runningIn !== 'web';
  user = toSignal(inject(AuthService).user);

  constructor(
    private readonly cookieService: CookieService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly historyService: NavigationService
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }

  closeMenu() {
    this.isOpen = false;
  }

  // Hover-based dropdown methods
  onDropdownMouseEnter(dropdownType: 'features' | 'integrations') {
    // Clear any existing leave timer
    if (this.dropdownLeaveTimer) {
      clearTimeout(this.dropdownLeaveTimer);
      this.dropdownLeaveTimer = null;
    }

    // Set a small delay before showing the dropdown
    this.dropdownHoverTimer = setTimeout(() => {
      this.openDropdown = dropdownType;
    }, 150); // 150ms delay for better UX
  }

  onDropdownMouseLeave() {
    // Clear the enter timer if it hasn't fired yet
    if (this.dropdownHoverTimer) {
      clearTimeout(this.dropdownHoverTimer);
      this.dropdownHoverTimer = null;
    }

    // Set a delay before hiding the dropdown to allow moving mouse to dropdown content
    this.dropdownLeaveTimer = setTimeout(() => {
      this.openDropdown = null;
    }, 100); // 100ms delay to allow moving to dropdown
  }

  onDropdownContentMouseEnter() {
    // Clear any leave timer when hovering over dropdown content
    if (this.dropdownLeaveTimer) {
      clearTimeout(this.dropdownLeaveTimer);
      this.dropdownLeaveTimer = null;
    }
  }

  onDropdownContentMouseLeave() {
    // Hide dropdown when leaving the content area
    this.dropdownLeaveTimer = setTimeout(() => {
      this.openDropdown = null;
    }, 100);
  }

  // Click-based methods for mobile/accessibility
  toggleFeaturesDropdown() {
    if (this.openDropdown === 'features') {
      this.openDropdown = null;
    } else {
      this.openDropdown = 'features';
    }
  }

  toggleIntegrationsDropdown() {
    if (this.openDropdown === 'integrations') {
      this.openDropdown = null;
    } else {
      this.openDropdown = 'integrations';
    }
  }

  closeAllDropdowns() {
    this.openDropdown = null;
    this.mobileSubmenuOpen = null;
    // Clear any timers
    if (this.dropdownHoverTimer) {
      clearTimeout(this.dropdownHoverTimer);
      this.dropdownHoverTimer = null;
    }
    if (this.dropdownLeaveTimer) {
      clearTimeout(this.dropdownLeaveTimer);
      this.dropdownLeaveTimer = null;
    }
  }

  toggleMobileSubmenu(submenu: 'resources') {
    if (this.mobileSubmenuOpen === submenu) {
      this.mobileSubmenuOpen = null;
    } else {
      this.mobileSubmenuOpen = submenu;
    }
  }

  closeMobileSubmenu() {
    this.mobileSubmenuOpen = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close dropdowns when clicking outside
    const target = event.target as HTMLElement;
    const isFeaturesButton = target.closest('.features-button');
    const isIntegrationsButton = target.closest('.integrations-button');
    const isDropdownContent = target.closest('.navbar-features-dropdown-panel');
    
    // Close dropdowns if clicking outside both buttons and dropdown content
    if (!isFeaturesButton && !isIntegrationsButton && !isDropdownContent) {
      this.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Close dropdowns on Escape key
    if (event.key === 'Escape') {
      this.closeAllDropdowns();
    }
    
    // Handle arrow key navigation when dropdown is open
    if (this.openDropdown && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      // Focus management could be added here for keyboard navigation within dropdown
    }
  }

  goBack() {
    this.historyService.back();
  }
}
