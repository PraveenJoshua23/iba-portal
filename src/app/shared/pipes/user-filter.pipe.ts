import { Pipe, PipeTransform } from '@angular/core';
// import { UserDetails } from '../models/user.model';

@Pipe({
  name: 'userFilter',
  standalone: true
})
export class UserFilterPipe implements PipeTransform {

  transform(users: any, searchTerm: string): any {
    
    console.log(users.filteredData, searchTerm)
    console.log(users.filteredData.length>0 && searchTerm === '' )
    if (users.filteredData.length>0 && searchTerm === '' ) {
      console.log(users.filteredData)
      return users.filteredData; // No filter applied, return all users
    }

    searchTerm = searchTerm.toLowerCase();
    return users.filteredData.filter((user: { name: string; }) => 
      user.name.toLowerCase().includes(searchTerm) 
    );
  }
}
