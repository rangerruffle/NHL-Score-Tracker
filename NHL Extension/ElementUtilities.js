function addClass(element, className) {
	if (element && !element.classList.contains(className)) {
		element.classList.add(className);
	}
}

function removeClass(element, className) {
	if (element && element.classList.contains(className)) {
		element.classList.remove(className);
	}
}

function hide(element) {
	if (element && !element.classList.contains("hidden")) {
		element.classList.add("hidden");
	}
}

function show(element) {
	if (element && element.classList.contains("hidden")) {
		element.classList.remove("hidden");
	}
}

function clearElement(element) {
	while (element.lastChild) {
		element.removeChild(element.lastChild);
	}
}