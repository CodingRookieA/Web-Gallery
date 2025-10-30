import { signin } from "./api.mjs"

function onError(err) {
    console.error("[error]", err);
    let error_box = document.querySelector("#error_box");
    error_box.innerHTML = err.message;
    error_box.style.visibility = "visible";
}

document.getElementById("signin").addEventListener("submit", function(e){
	e.preventDefault();
	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	signin(username, password, onError, function(){
		window.location.href = "./gallery.html";
	});

});

