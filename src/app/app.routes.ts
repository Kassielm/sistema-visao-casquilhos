import { Routes } from '@angular/router';
import { MainComponent } from './components/main/main.component';
import { SearchImageComponent } from './components/search-image/search-image.component';

export const routes: Routes = [
  { path: '', component: MainComponent },
  {
    path: 'search', component: SearchImageComponent
  }
];
