import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AppVersion, VersionService } from '@core/services/version';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrls: ['./footer.scss'],
  imports: [
    CommonModule
  ]
})
export class Footer implements OnInit {
  versionInfo?: AppVersion;
  isProdBuild = false;

  constructor(
    private versionService: VersionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.versionService.getVersion().subscribe(data => {
      this.versionInfo = data;
      this.isProdBuild = ['main'].includes(data.branch);
      this.cdr.detectChanges();
    });
  }
}
