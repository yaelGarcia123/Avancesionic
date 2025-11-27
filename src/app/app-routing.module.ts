import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ProfilePage } from './pages/main/profile/profile.page';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then((m) => m.AuthPageModule),
  },
  {
    path: 'main',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/main.module').then((m) => m.MainPageModule),
  },
  {
    path: 'profile',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/profile/profile.module').then(
        (m) => m.ProfilePageModule
      ),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/admin/admin.module').then((m) => m.AdminPageModule),
  },
  {
    path: 'admin-edit',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/admin-edit/admin-edit.module').then(
        (m) => m.AdminEditPageModule
      ),
  },
  {
    path: 'admin-add-house.page',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import(
        './pages/main/admin-add-house.page/admin-add-house.page.module'
      ).then((m) => m.AdminAddHousePagePageModule),
  },
  {
    path: 'messages',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/messages/messages.module').then(
        (m) => m.MessagesPageModule
      ),
  },
  {
    path: 'manager-tickets',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./pages/main/manager-tickets/manager-tickets.module').then(
        (m) => m.ManagerTicketsPageModule
      ),
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
