import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    // AppComponent injects several root services (AuthService → HttpClient, etc.);
    // the testing modules cover their dependencies.
    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, HttpClientTestingModule, NoopAnimationsModule]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it(`should have the 'starlinger_reco_client' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toEqual('starlinger_reco_client');
  });
});
