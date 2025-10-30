function handleReponse(res){
	if (res.status != 200) { return res.text().then(text => { throw new Error(`${text} (status: ${res.status})`)}); }
	return res.json();
}

export function getData() {
	return fetch(`/api/`).then(handleReponse);
}

export function signin(username, password, fail, success){
	const data = new FormData();

	data.append("username",username);
	data.append("password", password);

	fetch("/api/signin", {
		method: "POST",
		body: data
	}).then(handleReponse).then(success).catch(fail);

}

export function signup(username, password, fail, success){
	const data = new FormData();

	data.append("username",username);
	data.append("password", password);

	fetch("/api/signup", {
		method: "POST",
		body: data
	}).then(handleReponse).then(success).catch(fail);

}


export const limit_image = 100;

//Get the list of 100 image Id's of user
export function getImageIds(success, fail, skip, author) {
    fetch(`/api/images?skip=${skip}&limit=${limit_image}&author=${author}`, {
        method: "GET"
    }).then(handleResponse).then(success).catch(fail)
}

function handleResponse(res) {
    if (res.status != 200) {
        return res.text().then(function (text) {
            throw new Error(`${text} (Status: ${res.status})`)
        });
    }
    return res.json();
}


// add an image to the gallery
export function addImage(title, file, success, failure) {
    const data = new FormData();
    data.append("title", title);
    data.append("picture", file);
    fetch("api/images/", {
        method: "POST",
        body: data
    }).then(handleResponse)
        .then(success)
        .catch(failure);
}

// delete an image from the gallery given its imageId
export function deleteImage(imageId, callback, success) {
    fetch(`/api/images/${imageId}/`, {
        method: "DELETE"
    })
        .then(handleResponse)
        .then(success)
        .catch(callback);
}

// add a comment to an image
export function addComment(imageId, content, success, failure) {
    const data = new FormData();

    data.append("imageId", imageId);
    data.append("content", content);

    fetch("/api/comments/", {
        method: "POST",
        body: data
    }).then(handleResponse).then(success).catch(failure);
}


// delete a comment to an image
export function deleteComment(commentId,failure, success) {
    fetch(`/api/comments/${commentId}/`, {
        method: "DELETE"
    }).then(handleResponse).then(success).catch(failure);
}

//Get max 10 comments for an image
export function getComments(imageId, skip, success, fail){
    fetch(`/api/comments/${imageId}?skip=${skip}/`,{
        method: "GET"
    }).then(handleResponse).then(success).catch(fail);
}

//Get list of all users
export function getUsers(succuess, fail){
    fetch("/api/users", {
        method: "GET"
    }).then(handleReponse).then(succuess).catch(fail);
}

//Sign out
export function signout(fail, success){
    fetch("/api/signout", {
        method: "GET"
    }).then(handleReponse).then(success).catch(fail);
}