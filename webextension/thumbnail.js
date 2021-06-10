/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

chrome.storage.local.get({ 'thumbnailSize': 600, 'preferIcons': false }, async function (prefs) {
	let isIcon = false;

	let canvas = document.createElement('canvas');
	canvas.width = prefs.thumbnailSize;

	if (prefs.preferIcons) {
		let icon = await getIcon(canvas, prefs);
		if (icon) {
			isIcon = true;
		} else {
			getScreenShot(canvas);
		}
	} else {
		getScreenShot(canvas);
	}

	canvas.toBlob(function (blob) {
		chrome.runtime.sendMessage({
			name: 'Thumbnails.save',
			url: location.href,
			image: blob,
			isIcon: isIcon,
		});
	});
});

async function getIcon(canvas, prefs) {
	let icon = null;
	let size = 0;

	let links = document.querySelectorAll('link[rel=icon],link[rel=apple-touch-icon]');
	for (let link of links) {
		let linkSize = parseInt(link.sizes, 10) || 0;
		if (!icon || size < linkSize) {
			icon = link.href;
			size = linkSize;
			continue;
		}
	}

	if (!icon) {
		return false;
	}

	let context = canvas.getContext('2d');
	await loadImage(icon).then((img) => {
		canvas.height = prefs.thumbnailSize;
		let scale = Math.min(canvas.width / img.width, canvas.height / img.height);
		let x = (canvas.width / 2) - (img.width / 2) * scale;
		let y = (canvas.height / 2) - (img.height / 2) * scale;
		context.drawImage(img, x, y, img.width * scale, img.height * scale);
	});

	return true;
}

function getScreenShot(canvas) {
	let context = canvas.getContext('2d');
	let scale = canvas.width / document.documentElement.scrollWidth;
	canvas.height = Math.min(canvas.width, scale * document.documentElement.scrollHeight);

	context.scale(scale, scale);
	context.imageSmoothingEnabled = true;
	context.drawWindow(window, 0, 0, document.documentElement.scrollWidth, document.documentElement.scrollWidth, '#fff');
}

function loadImage(url) {
	return new Promise(r => { let i = new Image(); i.onload = (() => r(i)); i.src = url; });
}
