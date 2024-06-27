import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sort',
  standalone: true
})
export class SortPipe implements PipeTransform {

  transform(lessons: any[]|null): any[] {
    if(!lessons){
      return [];
    }
    return lessons.sort((a, b) => a.lessonNo - b.lessonNo);
  }

}
