# RESTFul API

## Introduction

What do we do? Why do we do it and why should we be writing about it?

## HTTP Status Codes

* 200 - Success + response with appropriate content.
* 401 - When restricted resource was accessed without auth token or when username/password validation failed.
* 422 - When a request fails validation. See [this StackOverflow answer](http://stackoverflow.com/a/3291292) for more information about the choice.
* 500 - When an error occurred which is not related to request validation or rule violation.
