import { Routes } from '@angular/router';
import { LayoutComponent as AuthLayoutComponent } from './component/auth/layout/layout.component';
import { LoginFormComponent } from './component/auth/login-form/login-form.component';
import { RegisterFormComponent } from './component/auth/register-form/register-form.component';
import { LandingPageComponent } from './component/landing-page/landing-page.component';
import { OtpComponent } from './component/auth/otp/otp.component';
import { ChangePasswordComponent } from './component/auth/change-password/change-password.component';
import { ChangePasswordComponent as ProfileChangePasswordComponent } from './component/main/profile/change-password/change-password.component';
import { LayoutComponent as AppLayoutComponent } from './component/main/layout/layout.component';
import { LayoutComponent as FriendSectionLayoutComponent } from './component/main/friends-section/layout/layout.component';
import { DiscoverComponent } from './component/main/discover/discover.component';
import { ProfileComponent } from './component/main/profile/profile.component';
import { FriendsComponent } from './component/main/friends-section/friends/friends.component';
import { OnlineComponent } from './component/main/friends-section/online/online.component';
import { PendingComponent } from './component/main/friends-section/pending/pending.component';
import { AddfriendComponent } from './component/main/friends-section/addfriend/addfriend.component';
import { BlockedComponent } from './component/main/friends-section/blocked/blocked.component';
import { DirectMessageComponent } from './component/main/direct-message/direct-message.component';
import { EmailVerifyComponent } from './component/auth/email-verify/email-verify.component';
import { AuthGuardChild } from './guards/auth.guard';
import { EditProfileComponent } from './component/main/profile/edit-profile/edit-profile.component';
import { ComunityLayoutComponent } from './component/main/community/layout/layout.component';
import { CreateCommunityLayoutComponent } from './component/main/create-community/layout/layout.component';
import { CommunityCreateStepOneComponent } from './component/main/create-community/step-one/step-one.component';
import { CommunityCreateStepTwoComponent } from './component/main/create-community/step-two/step-two.component';
import { CommunityCreateStepThreeComponent } from './component/main/create-community/step-three/step-three.component';
import { AboutComponent } from './component/main/community/about/about.component';
import { ChatroomComponent } from './component/main/community/chatroom/chatroom.component';
import { VoiceroomComponent } from './component/main/community/voiceroom/voiceroom.component';


export const routes: Routes = [
  {
    path: "auth", component: AuthLayoutComponent,
    canActivateChild: [AuthGuardChild],
    data: { title: "Account" },
    children: [
      { path: "login", component: LoginFormComponent, data: { title: "Login" } },
      { path: "register", component: RegisterFormComponent, data: { title: "Register" } },
      { path: "email_verify", component: EmailVerifyComponent, data: { title: "Email" } },
      { path: "otp", component: OtpComponent, data: { title: "Verify" } },
      { path: "change_pass", component: ChangePasswordComponent, data: { title: "Reset password" } }
    ]
  },

  {
    path: "main", component: AppLayoutComponent,
    canActivateChild: [AuthGuardChild],
    children: [
      { path: "discover", component: DiscoverComponent, data: { title: "Discover" } },
      { path: "profile", component: ProfileComponent, data: { title: "Profile" } },
      { path: "edit_profile", component: EditProfileComponent, data: { title: "Edit profile" } },
      { path: 'change_password', component: ProfileChangePasswordComponent, data: { title: "Change password" } },
      {
        path: "friends_section", component: FriendSectionLayoutComponent,
        data: { title: "Friends" },
        children: [
          { path: "friends", component: FriendsComponent, data: { title: "Friends" } },
          { path: "online", component: OnlineComponent, data: { title: "Online" } },
          { path: "pending", component: PendingComponent, data: { title: "Pending" } },
          { path: "blocked", component: BlockedComponent, data: { title: "Blocked" } },
          { path: "addfriend", component: AddfriendComponent, data: { title: "Add friend" } }
        ]
      },
      { path: "direct_message", component: DirectMessageComponent, data: { title: "Messages" } },
      { path: "community/:id", component: ComunityLayoutComponent,
        data: { title: "Community" },
        children: [
          { path: '', redirectTo: 'about', pathMatch: 'full' },
          { path: "about", component: AboutComponent, data: { title: "Community" } },
          { path: "chatroom/:channelId", component: ChatroomComponent, data: { title: "Chat" } },
          { path: "voiceroom/:channelId", component: VoiceroomComponent, data: { title: "Voice" } },
        ]
      },
      {
        path: 'community/create',
        component: CreateCommunityLayoutComponent,
        data: { title: "Create community" },
        children: [
          { path: '', redirectTo: 'step-one', pathMatch: 'full' },
          { path: 'step-one', component: CommunityCreateStepOneComponent, data: { title: "Create community" } },
          { path: 'step-two', component: CommunityCreateStepTwoComponent, data: { title: "Create community" } },
          { path: 'step-three', component: CommunityCreateStepThreeComponent, data: { title: "Create community" } },
        ]
      }
    ]
  },
  { path: "",canActivateChild: [AuthGuardChild], component: LandingPageComponent, data: { title: "Hive" } }

];
