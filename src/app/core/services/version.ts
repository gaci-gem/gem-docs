import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';

export interface AppVersion {
  version: string;
  branch: string;
  commitHash: string;
  buildTime: string;
  build?: string;
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  private version$?: Observable<AppVersion>;

  constructor(private http: HttpClient) { }

  getVersion(): Observable<AppVersion> {
    if (!this.version$) {
      this.version$ = this.http
        .get<AppVersion>('assets/version.json?nocache=' + Date.now())
        .pipe(shareReplay(1));
    }
    return this.version$;
  }
}
