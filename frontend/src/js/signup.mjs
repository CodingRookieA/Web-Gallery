import { signup } from "./api.mjs"

function onError(err) {
    console.error("[error]", err);
    let error_box = document.querySelector("#error_box");
    error_box.innerHTML = err.message;
    error_box.style.visibility = "visible";
}

document.getElementById("signup").addEventListener("submit", function(e){
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    signup(username, password, onError, function(){
        window.location.href = "/";
    });

});