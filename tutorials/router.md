# Understanding This Router File
When a user's browser sends a request to the server, this router decides:
1. What page should be returned?
2. Should a handler process the request?
3. Should an image be sent?
4. Should a CSS or JavaScript file be sent?
5. What should happen if the page doesn't exist?

---

## Step 1: Understanding What a Router Does
In a web application:
```
Browser ---> Server ---> Router ---> Response
```
Example:

A user enters:
```
http://localhost:3000/about
```

The browser sends a request:
```
GET /about 
```
---

##  Step 2: Importing Modules
At the top:

```javascript:num
const fs = require("fs");
const path = require("path");oconst { loginHandler } = require{"./handlers/login");

```
---

### fs

`fs` stands for **File System**.

Node.js provides this module for reading and writing files.

Example:

```javascript
fs.readFile("index.html", callback);
```
This reads a file from disk.

The router uses it to load HTML, CSS, JavaScript, and image files.

---

### path

`path` helps build file paths safely.

Example:
```javascript
path.join("images", "cat.png");
```

Produces:
```
images/cat.png
```

This works correctly regardless of operating system.

Without path:
```
"images/" + filename
```
You risk creating incorrect paths on some systems.

---

### loginHandler

```javascript
const { loginHandler } = require("./handlers/login");
```
This imports a function from another file.

Think:
```
import loginHandler
```
but in Node.js CommonJS syntax.

The router doesn't want to contain all login logic.

Instead:
```
router
  └── delegates login work
        └── loginHandler()
```
This separation makes code cleaner.

---

## Step 3: The Router Function

```javascript
async function router(req, res)
```
This function accepts:
**req**
The incoming request.
Contains information such as:
```
req.method
```
Example:
```
GET
POST
PUT
DELETE
```
And:
```
req.url
```
Example:
```javascript
/
about
api/login
```
---

**res**

The outgoing response.
This is how the server talks back to the browser.
Examples:
```javascript
res.writeHead(...)
```
Set status codes and headers.
```javascript
res.end(...)
```
Send data and finish the response.

---

## Step 4: Why async?

```javascript
async function router(req, res)
```
Because some work takes time.

Example:
```javascript
await loginHandler(req, res);
```
The router must wait until login processing finishes.
Without `async`:
```javascript
await
```
would not be allowed.
---
## Step 5: Error Handling

The entire router is wrapped in:

```javascript
try {
    ...
}
catch(error) {
    ...
}
```
This prevents your server from crashing when something unexpected happens.
---
Imagine:
```javascript
undefined.someFunction()
```
Normally:
```
Server crashes
```
With:
```javascript
try/catch
```
The error is caught and converted into an HTTP response.
---
## Step 6: API Routing
The first route:
```javascript
if (
    req.method === "POST" && 
    req.url === "/api/login"
)
{
    await loginHandler(req, res);
    return;
}
```
---
Let's break it down.
**req.method**
```
POST
```
means:
"The browser is sending data to the server."
Usually login forms use POST. 
---
**req.url**
```javascript
/api/login
```
means:
```javascript
localhost:3000/api/login
```
---
**Full Interpretation**
```
if POST arrives at `/api/login`
```
then:
```javascript
loginHandler(req,res);
```
processes the login.
---
**Why return?**
```javascript
return;
```
stops the router.
Otherwise it would continue checking every route below.
---
## Step 7: Serving HTML Pages
Example:
```javascript
if (req.method === "GET" &&
    (req.url === "/" || req.url === "/home"))
{
    sendPage(res, "index.html", "text/html");
    return;
}
```
## Step 8: CSS Routing
```javascript
if (req.method === "GET" &&
    req.url === "/style")
{
    sendPage(res,
             "style.css",
             "text/css");
}
```
Notice the content type:
```javascript
"text/css"
```
This tells the browser:
```
Interpret this file as CSS.
```
## Step 9: JavaScript Routing
Example:
```javascript
if (req.method === "GET" &&
    req.url === "/js/login.js")
{
    sendPage(
        res,
        path.join("js", "login.js"),
        "application/javascript"
    );
}
```
## Step 10: Image Routing
This is the most interesting part.
```javascript
if (
    req.method === "GET" &&
    req.url.startsWith("/images/")
)
```
Notice:
```
startsWith()
```
instead of:
```
=== "/images/cat.png"
```
because there could be hundreds of images.
---
### Extract Filename
```javascript
const filename = 
    path.basename(req.url);
```
Suppose:
```
req.url
```
equals:
```
/images/cat.png
```
Then:
```
filename
```
becomes:
```
cat.png
```
---
### Extract Extension
```javascript
const ext = 
    path.extname(filename).toLowerCase();
```
For:
```
cat.png
```
returns:
```
.png
```
For:
```
DOG.JPG
```
returns:
```
.jpg
```
(after conversion to lowercase)
---
## Step 11: Determing Content Type
Initial value:
```javascript
let contentType =
    "application/octet-stream";
```
This means:
```
generic binary file
```
It's the default fallback type:
---
Then:
```javascript
if (ext === '.webp')
```
Set:
```
image/webp
```
---
```javascript
else if (ext === '.png')
```
Set:
```javascript
image.png
```
---
```javascript
else if (
    ext === '.jpg' ||
    ext === '.jpeg'
)
```
Set:
```
image/jpeg
```
---
```javascript
else if (ext === '.gif')
```
Set:
```
image/gif
```
---
Why?
The browser needs to know what kind fo file it is receiving.
Without the correct MIME type, the browser may not display the image correctly.

---

## Step 12: Sending the Image

```javascript
sendPage(
    res,
    path.join("images", filename),
    contentType
)
```

If:

```
filename = "cat.png"
```

Then:

```
images/cat.png
```

is sent.

---

## Step 13: 404 Not Found

If none of the routes match:

```javascript
res.writeHead(
    404,
    { "Content-Type": "text/html" }
);
```

Sets status code:

```
404 Not Found
```

Then:

```javascript
res.end("<h1>404 - Page Not Found</h1>");
```

sends a simple page.

---

Example:

User requests:

```
GET /banana
```

No route exists.

Response:

![<h1>404 - Page Not Found</h1>](image.png)

## Step 14: Error Handling Details

Inside catch:

```javascript
console.error(error);
```

Logs the error on the server.

---

Then:

```javascript
if (!res.headersSent)
```

checks whether a response has already started.

Because once headers are sent:

```
200 OK
```

cannot be changed to:

```
500 Error
```
---

### Choosing a Status Code 

```javascript
const statusCode =
    error.statusCode ||
    (
      error instanceof TypeError
      ? 400
      : 500
    );
```

Meaning
* Use custom status if available.
* Use 400 for TypeErrors.
* Otherwise use 500.

---

Then:

```javascript
res.writeHead(statusCode,
{
    "Content-Type":
    "application/json"
});
```

---

And:

```javascript
res.end(
    JSON.stringify({
        error: error.message
    })
);
```

Returns:

```javascript
{
  "error": "Invalid password"
}
```
for example.

---

## Step 15: The sendPage() Function

This function does all actual file serving.

```javascript
function sendPage(
    res,
    filename,
    contentType
)
```
Arguments:

| Parameter | Purpose           |
| :---      | :---              |
| res       | Response object   |
| filename  | File to load      |
| contentType | MIME type |

---

### Build Full Path

```javascript
const filePath = 
    path.join(
        __dirname,
        "public",
        filename
    );
```

suppose

```javascript
filename = "about.html"
```

and:

```javascript
__dirname
```
is:

```javascript
project/
```
Result:

```javascript
project/public/about.html
```

---

### What is `__dirname?`

Node automatically provides:

```javascript
__dirname
```

which means:

```
Folder containing the current file.
```

---

## Step 16: Read the File

```javascript
fs.readFile(
    filePath,
    (err,data)=>{

    }
);
```
This is asynchronous.

Node starts reading the file and continues working.

When finished:

```
(err, data)
```

becomes available.

---

### If Error

```
if (err)
```
Possible reasons:
* File missing
* Permission denied
* Corrupt disk

---

Return:

```
500 Server Error
```

---

## Step 17: Successful File Read

If no error:

```javascript
res.writeHead(
    200,
    { "Content-Type": contentType }
);
```

Sets:

```
200 OK
```

and appropriate MIME type.

---

Then:

```
res.end(data);
```

sends the file contents.

---

## Big Picture: What Happens During a Request?

Suppose a user visits:

```
http://localhost:3000/about
```

### Step 1

Browser sends:
```HTTP
GET /about
```

### Step 2

Router receives:
```javascript
req.method === "GET"
req.url === "/about"
```

### Step 3

Matching route found:
```javascript
sendPage(
    res,
    "about.html",
    "text/html"
);
```

### Step 4

`sendPage()` builds path:
```
project/public/about.html
```

### Step 5

`fs.readfile()` loads file.

### Step 6

Server returns
```HTTP
200 OK
Content-Type: text/html
```

### Step 7

Brower renders the page.

## Architectural Summary

This router follows a very common web-server pattern:

```
Request
   ↓
Router
   ↓
Route Match?
   ↓
 ┌──────────────┐
 │ API Handler  │
 └──────────────┘
       or
 ┌──────────────┐
 │ Static File  │
 └──────────────┘
       ↓
Response
```

Conceptually, the file has three responsibilities:
1. Route requests by inspecting `req.method` and `req.url`.
2. Delegate application logic such as login to handler functions.
3. Server static assets such as HTML, CSS, JavaScript, and images from the public folder.