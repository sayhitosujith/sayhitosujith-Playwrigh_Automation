import {test as baseTest, expect} from '@playwright/test';

interface ILoginPageElements {
    usernameinput: import('@playwright/test').Locator;
    passwordinput: import('@playwright/test').Locator;
    loginbutton: import('@playwright/test').Locator;
}

interface ILoginPageConstructor {
    page: import('@playwright/test').Page;
}

export class LoginPage {
    usernameinput;
    passwordinput;
    loginbutton;

    constructor(private page: ILoginPageConstructor['page']) {
        this.usernameinput = this.page.getByRole('textbox', { name: 'Enter Email ID / Username' });
        this.passwordinput = this.page.getByRole('textbox', { name: 'Enter Password' });
        this.loginbutton = this.page.getByRole('button', { name: 'Login', exact: true });
    }
}

export { baseTest as test, expect };