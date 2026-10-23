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

interface SimpleSemver {
  major: number;
  minor: number;
  patch: number;
}

function parseSimpleSemver(version: string | null): SimpleSemver | null {
  const match = version?.trim().match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function shouldShowChangelog(currentVersion: string | null, lastSeenVersion: string | null): boolean {
  if (!currentVersion) return false;
  if (!lastSeenVersion) return true;

  const current = parseSimpleSemver(currentVersion);
  const lastSeen = parseSimpleSemver(lastSeenVersion);
  if (!current) return false;
  if (!lastSeen) return true;

  return current.major > lastSeen.major
    || (current.major === lastSeen.major && current.minor > lastSeen.minor);
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
