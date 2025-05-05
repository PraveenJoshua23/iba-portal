// src/app/shared/pipes/translate.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/language/language.service';

@Pipe({
    name: 'translate',
    standalone: true,
})
export class TranslatePipe implements PipeTransform {
    private translationService = inject(TranslationService);

    transform(key: string, params?: any): string {
        return this.translationService.instant(key, params);
    }
}
