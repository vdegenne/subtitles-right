import type {UserCredential, UserInfo} from 'firebase/auth';
import {userCtrl} from './UserController.js';

export async function loginOrLogout() {
	if (!userCtrl.isConnected) {
		return await login();
	} else {
		return await logout();
	}
}

/**
 * Here's an example how to use it:
 *
 * ```javascript
 * async #login() {
 *   if (!userCtrl.isConnected) {
 *     try {
 *       const {login} = await import('../firebase/LoginOrLogout.js');
 *       await login();
 *       this.dialog.close();
 *       // To get a fully updated user controller
 *       const {getOnAuthStateChangedComplete} = await import('../firebase/onAuthStateChanged.js');
 *       const userCtrl = await getOnAuthStateChangedComplete();
 *       if (userCtrl.isAuthorized) {
 *         // do something
 *       }
 *     } catch {
 *       // canceled
 *       return;
 *     }
 *   }
 * }
 * ```
 *
 * Check `onAuthStateChanged.ts` for more details.
 */
export async function login() {
	return new Promise<{
		credential: UserCredential;
		user: UserInfo;
		isNewUser: boolean;
	}>(async (resolve, reject) => {
		if (userCtrl.isConnected) {
			// Already connected
			reject('Already logged in');
			return;
		}
		const {
			getAuth,
			signInWithPopup,
			GoogleAuthProvider,
			getAdditionalUserInfo,
		} = await import('firebase/auth');
		try {
			const credential = await signInWithPopup(
				getAuth(),
				new GoogleAuthProvider(),
			);
			const isNewUser = !!getAdditionalUserInfo(credential)?.isNewUser;
			userCtrl.isNewUser = isNewUser;
			resolve({
				credential,
				user: credential.user,
				isNewUser,
			});
		} catch (error) {
			reject('Canceled');
		}
	});
}

/**
 * Here's an example how to use it:
 *
 * ```javascript
 * @confirm({content: 'You will be logged out'})
 * private async logout() {
 *   if (userCtrl.isConnected) {
 *     try {
 *       const {logout} = await import('../firebase/LoginOrLogout.js');
 *       await logout();
 *       this.dialog.close();
 *       toastit('Logged out');
 *     } catch {
 *       return;
 *     }
 *   }
 * }
 * ```
 */
export async function logout() {
	return new Promise<void>(async (resolve, reject) => {
		if (!userCtrl.isConnected) {
			// Already logged out
			reject('Already logged out');
			return;
		}
		// const {materialConfirm} = await import('material-3-prompt-dialog');
		// try {
		// 	await materialConfirm({
		// 		headline: 'Sign out?',
		// 		content: 'Are you sure you want to sign out?',
		// 	});
		// } catch {
		// 	reject('Canceled');
		// 	return;
		// }
		const {getAuth} = await import('firebase/auth');
		try {
			await getAuth().signOut();
			resolve();
		} catch {
			reject('Something went wrong');
		}
	});
}
