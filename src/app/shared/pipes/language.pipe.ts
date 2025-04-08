import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageContentService } from '../services/language/language-content.service';

@Pipe({
    name: 'translate',
    standalone: true,
    pure: false, // Make it impure so it responds to language changes
})
export class TranslatePipe implements PipeTransform {
    private languageContent = inject(LanguageContentService);

    transform(key: string): string {
        return this.languageContent.translate(key);
    }
}
