import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgxDhis2MenuModule } from '@hisptz/ngx-dhis2-menu';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { EffectsModule } from '@ngrx/effects';
import { reducers, metaReducers, effects } from './store';
import { AppRoutingModule } from './app-routing.module';
import {
  StoreRouterConnectingModule,
  RouterStateSerializer
} from '@ngrx/router-store';
import { RouteSerializer, CoreModule } from './core';
import { HttpClient } from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SharedModule } from './shared/shared.module';
import { components } from './components';
import { containers } from './containers';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { ToasterModule } from 'angular2-toaster';
import { PaginationModule, BsDropdownModule } from 'ngx-bootstrap';
import { NgxPaginationModule } from 'ngx-pagination';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { OrderModule } from 'ngx-order-pipe';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, ...containers, ...components],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    NgxPaginationModule,
    CoreModule,
    TooltipModule.forRoot(),
    BsDropdownModule.forRoot(),
    TabsModule.forRoot(),
    PopoverModule.forRoot(),
    CollapseModule.forRoot(),
    ToasterModule.forRoot(),
    PaginationModule.forRoot(),
    SharedModule,
    FormsModule,
    FilterPipeModule,
    OrderModule,
    NgxJsonViewerModule,

    /**
     * Translation module
     */
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    AppRoutingModule,
    /**
     * @ngrx/router-store keeps router state up-to-date in the store
     */
    StoreRouterConnectingModule,
    /**
     * Menu  module
     */
    NgxDhis2MenuModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot(effects)
  ],
  providers: [{ provide: RouterStateSerializer, useClass: RouteSerializer }],
  bootstrap: [AppComponent]
})
export class AppModule {}
