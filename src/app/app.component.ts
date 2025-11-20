import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslationService } from './shared/services/language/language.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    standalone: true,
    imports: [CommonModule, RouterModule],
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    title = 'iba-portal';
    private translationService = inject(TranslationService);
    ngOnInit() {
        // Preload all translations
        this.translationService.preloadAllTranslations().subscribe();
    }
}
