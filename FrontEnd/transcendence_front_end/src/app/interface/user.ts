export interface User {
    id : number,
    email : string,
    password : string,
    is_superuser : boolean,
    otp : string,
    is_intra_user : boolean,
    is_active: boolean;
}
