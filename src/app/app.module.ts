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
import { containers } from './containers';
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
import { FunctionEditorComponent } from './containers/function-editor/function-editor.component';
import { EditorComponent } from './containers/editor/editor.component';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { PopoverModule } from 'ngx-bootstrap/popover';
import { FunctionListComponent } from './containers/function-list/function-list.component';
import { MomentModule } from 'angular2-moment';
import {ToasterModule,ToasterService} from 'angular2-toaster';
import {DataTableModule} from 'angular-6-datatable';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent, ...containers, FunctionEditorComponent, EditorComponent, FunctionListComponent],
  imports: [
    BrowserModule,
    MomentModule,
    ToasterModule,
    BrowserAnimationsModule,
    CoreModule,
    TooltipModule.forRoot(),
    TabsModule.forRoot(),
    PopoverModule.forRoot(),
    CollapseModule.forRoot(),
    SharedModule,
    FormsModule,
    DataTableModule,

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
    NgxDhis2MenuModule.forRoot(),
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot(effects)
  ],
  providers: [{ provide: RouterStateSerializer, useClass: RouteSerializer },ToasterService],
  bootstrap: [AppComponent]
})
export class AppModule {}
