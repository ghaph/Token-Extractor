const cookieNameMap = {
	'twitter.com': 'auth_token',
	'github.com': 'user_session',
	'soundcloud.com': 'oauth_token',
	'twitch.tv': 'auth-token',
};

const cookieResult = document.getElementById('cookie-result');
const copyButton = document.getElementById('copy-button');

function displayValue(name, value) {
	cookieResult.innerHTML = `<strong>[${name}]</strong> ${value}`;
	copyButton.addEventListener('click', () => {
		navigator.clipboard.writeText(value);
		copyButton.textContent = 'Copied!';
		setTimeout(() => (copyButton.textContent = 'Copy Token'), 1000);
	});
}

chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
	try {
		const split = new URL(tab.url).hostname.replace('www.', '').split('.');

		// excudes subdomains
		const domain = split[split.length - 2] + '.' + split[split.length - 1];
		console.log(`Current domain: ${domain}`);

		switch (domain) {
			case 'discord.com':
				try {
					const [token] = await chrome.scripting.executeScript({
						target: { tabId: tab.id },
						function: () => {
							// have to reload so the token is put into local storage
							window.location.reload();
							return window.localStorage?.token;
						},
					});

					if (!token.result) {
						throw new Error('No token found');
					}

					displayValue('token', token.result.replaceAll('"', ''));
				} catch (e) {
					console.error(e);
					cookieResult.textContent = 'An error occurred while fetching the token.';
				}
				break;
			default:
				try {
					const cookieName = cookieNameMap[domain];

					if (cookieName) {
						const cookie = await getCookie(tab.url, cookieName);
						console.log(cookie);
						if (cookie) {
							displayValue(cookieName, cookie.value);
						} else {
							cookieResult.textContent = 'No cookie found.';
						}
					} else {
						cookieResult.textContent = 'Invalid domain. Please open a supported website.';
					}
				} catch (e) {
					console.error(e);
					cookieResult.textContent = 'An error occurred while fetching the cookie for this domain.';
				}
				break;
		}
	} catch (e) {
		cookieResult.textContent = 'An error occurred while fetching the cookie. Most likely an invalid domain.';
	}
});

function getCookie(url, name) {
	return new Promise((resolve, reject) => {
		chrome.cookies.get({ url, name }, (cookie) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(cookie);
			}
		});
	});
}

window.addEventListener('DOMContentLoaded', () => {
	document.getElementById('github').addEventListener('click', () => {
		window.open('https://github.com/median/Token-Extractor');
	});
});
