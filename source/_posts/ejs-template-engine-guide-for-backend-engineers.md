---
title: EJS Template Engine Guide for Backend Engineers
date: 2025-05-03 17:20:00
categories:
  - Frontend
tags:
  - JavaScript
  - Node.js
---

# Understanding EJS: A Comprehensive Guide for Backend Engineers

## What is EJS?

EJS (Embedded JavaScript Templates) is a simple yet powerful templating language that lets you generate HTML markup with plain JavaScript. The "E" can stand for "Embedded," "Effective," "Elegant," or simply "Easy" - all of which describe this lightweight templating engine.

> **EJS follows a simple philosophy: use JavaScript for template logic without inventing a new syntax.**

As a backend engineer, you'll appreciate EJS for its simplicity and flexibility. Unlike other templating engines that require learning a new syntax, EJS uses plain JavaScript, making it immediately accessible to anyone familiar with JS.

```javascript
// Simple EJS example
const ejs = require('ejs');
const template = '<h1>Hello, <%= name %>!</h1>';
const html = ejs.render(template, { name: 'World' });
// Output: <h1>Hello, World!</h1>
```

EJS is particularly useful when:
- You need to **dynamically generate HTML** from data on the server
- You want to avoid reinventing control flow structures
- You prefer to work directly with JavaScript rather than learn a new templating language
- You want a straightforward way to include **partials and layouts** for code reuse

## EJS Tags

EJS provides a variety of tags for different templating needs:

### 1. `<% %>` (Scriptlet Tag)

Used for control flows and JavaScript logic without outputting anything.

```ejs
<% if (user) { %>
  <h2>Welcome, <%= user.name %></h2>
<% } else { %>
  <h2>Please log in</h2>
<% } %>
```

### 2. `<%= %>` (Output Tag - HTML Escaped)

Outputs the value into the template, **escaping any HTML characters to prevent XSS attacks**.

```ejs
<p>User input: <%= userComment %></p>
<!-- If userComment contains "<script>", it will be rendered as "&lt;script&gt;" -->
```

### 3. `<%- %>` (Output Tag - Unescaped)

Outputs the unescaped value. Useful for including HTML content or partials.

```ejs
<%- include('partials/header') %>
<p>Main content here</p>
<%- include('partials/footer') %>
```

### 4. `<%# %>` (Comment Tag)

Used for comments that won't be included in the output.

```ejs
<%# This comment won't appear in the rendered HTML %>
```

### 5. Additional Tags

- `<%_` and `_%>`: "Whitespace Slurping" tags that remove whitespace
- `<%%`: Outputs a literal '<%'
- `-%>` and `_%>`: Trim-mode tags that control whitespace

> **Security Tip:** Always use `<%= %>` (escaped output) when rendering user-provided data to prevent XSS attacks.

## Passing Data to EJS Templates

### Server to EJS

A key part of using EJS is passing data from your server to your templates. This is typically done with an object passed as the second parameter to the `render` function.

```javascript
// In Express.js
app.get('/', (req, res) => {
  res.render('index', {
    title: 'Home Page',
    user: {
      name: 'John',
      isAdmin: true
    },
    items: ['Item 1', 'Item 2', 'Item 3']
  });
});
```

Then in your EJS template:

```ejs
<h1><%= title %></h1>

<% if (user && user.isAdmin) { %>
  <div class="admin-panel">
    <h2>Admin Panel</h2>
    <!-- Admin content here -->
  </div>
<% } %>

<ul>
  <% for (let i = 0; i < items.length; i++) { %>
    <li><%= items[i] %></li>
  <% } %>
</ul>
```

### Handling Missing Data Safely

When working with data that might not be available, it's good practice to check for its existence to avoid errors. There are several approaches:

1. **Using conditional checks**:

```ejs
<% if (locals.user) { %>
  <h2>Welcome, <%= user.name %></h2>
<% } else { %>
  <h2>Welcome, Guest</h2>
<% } %>
```

2. **Using the `locals` object**:

```ejs
<h2>Welcome, <%= locals.user ? user.name : 'Guest' %></h2>
```

The `locals` object contains all variables passed to the template, so `locals.user` will be `undefined` if no user was passed rather than throwing an error.

3. **Using optional chaining (ES2020)**:

```ejs
<h2>Welcome, <%= user?.name || 'Guest' %></h2>
```

> **Best Practice:** The `locals` approach is preferred for robust templates as it prevents "variable is not defined" errors that might crash your application.

### EJS to Server (Form Submission)

Data can flow back to the server through HTML forms:

```ejs
<form action="/submit" method="post">
  <input type="text" name="username" required>
  <textarea name="comment"></textarea>
  <button type="submit">Submit</button>
</form>
```

On the server with Express:

```javascript
// Don't forget to include body-parser middleware
app.use(express.urlencoded({ extended: true }));

app.post('/submit', (req, res) => {
  const { username, comment } = req.body;
  // Process the data
  console.log(`Received comment from ${username}: ${comment}`);
  // Respond or redirect
  res.redirect('/thank-you');
});
```

## EJS Partials and Layouts

**Partials and layouts** allow you to organize and reuse code across multiple pages, which is crucial for maintaining consistent design and reducing duplication.

### Partials

Partials are reusable template fragments that can be included in other templates:

```ejs
<!-- views/partials/header.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <h1>My Website</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
```

```ejs
<!-- views/partials/footer.ejs -->
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> My Website</p>
  </footer>
</body>
</html>
```

Then include them in your main template:

```ejs
<!-- views/index.ejs -->
<%- include('partials/header') %>

<main>
  <h2>Welcome to my site!</h2>
  <p>This is the homepage content.</p>
</main>

<%- include('partials/footer') %>
```

> **Note:** When including partials, use the `<%-` tag to ensure the HTML isn't escaped.

### Layouts

While EJS doesn't have built-in layout support like some template engines, you can implement layouts using partials:

```ejs
<!-- views/layouts/main.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <h1>My Website</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  
  <main>
    <%- body %>
  </main>
  
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> My Website</p>
  </footer>
</body>
</html>
```

To use this layout, you can create a wrapper function:

```javascript
// In your Express app setup
app.use((req, res, next) => {
  res.renderWithLayout = (view, options) => {
    const mainContent = ejs.renderFile(`./views/${view}.ejs`, options);
    res.render('layouts/main', { 
      ...options, 
      body: mainContent 
    });
  };
  next();
});

// Then in your routes
app.get('/', (req, res) => {
  res.renderWithLayout('index', { title: 'Home' });
});
```

Alternatively, you can use the **`express-ejs-layouts`** package for more streamlined layout support.

## Using EJS to Generate a Static Website

EJS isn't just useful for dynamic web applications; it can also be used to **generate static websites**. Here's how:

### Basic Static Site Generation

1. Create a project structure:

```
/static-site-generator
  /templates
    layout.ejs
    index.ejs
    about.ejs
  /data
    site.json
  /public
    /css
    /js
  generator.js
```

2. Define your data:

```json
// data/site.json
{
  "title": "My Static Site",
  "pages": [
    {
      "name": "Home",
      "path": "index.html",
      "content": "Welcome to my static site generated with EJS!"
    },
    {
      "name": "About",
      "path": "about.html",
      "content": "This is a static site generator using EJS templates."
    }
  ]
}
```

3. Create your templates:

```ejs
<!-- templates/layout.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= site.title %> - <%= page.name %></title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <h1><%= site.title %></h1>
    <nav>
      <% for(let i = 0; i < site.pages.length; i++) { %>
        <a href="/<%= site.pages[i].path %>"><%= site.pages[i].name %></a>
      <% } %>
    </nav>
  </header>
  
  <main>
    <%- content %>
  </main>
  
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> <%= site.title %></p>
  </footer>
</body>
</html>
```

4. Create the generator script:

```javascript
// generator.js
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

// Load site data
const siteData = require('./data/site.json');

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate each page
siteData.pages.forEach(page => {
  // Render page content first
  const pageContent = fs.readFileSync(`./templates/${page.path.replace('.html', '.ejs')}`, 'utf8');
  const renderedContent = ejs.render(pageContent, { site: siteData, page });
  
  // Then render the layout with the content
  const layoutTemplate = fs.readFileSync('./templates/layout.ejs', 'utf8');
  const renderedPage = ejs.render(layoutTemplate, {
    site: siteData,
    page,
    content: renderedContent
  });
  
  // Write the rendered page to the output directory
  fs.writeFileSync(path.join(outputDir, page.path), renderedPage);
  console.log(`Generated ${page.path}`);
});

// Copy static assets
const staticDir = path.join(__dirname, 'public');
if (fs.existsSync(staticDir)) {
  // You'd need a function to copy directories recursively here
  // For simplicity, we'll just note that you should copy your static assets
  console.log('Copying static assets...');
}

console.log('Static site generation complete!');
```

5. Run the generator:

```bash
node generator.js
```

### Advanced Features for Static Site Generation

For a more robust static site generator with EJS, you might want to:

1. Add support for **Markdown content** using a package like `marked`
2. Implement a blog with automatic post listing and pagination
3. Create an **asset pipeline** for preprocessing CSS and JavaScript
4. Add a dev server for local development with **live reloading**
5. Implement a build process for optimizing images and other assets

Here's an example of converting Markdown to HTML with EJS:

```javascript
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const marked = require('marked');

// Read a markdown file
const markdownContent = fs.readFileSync('./content/blog-post.md', 'utf8');

// Convert to HTML
const htmlContent = marked(markdownContent);

// Use EJS to render the full page
const template = fs.readFileSync('./templates/blog-post.ejs', 'utf8');
const renderedPage = ejs.render(template, {
  title: 'My Blog Post',
  content: htmlContent,
  date: new Date().toLocaleDateString()
});

// Write the output
fs.writeFileSync('./output/blog-post.html', renderedPage);
```

## Conclusion

**EJS is a flexible, approachable templating engine** that brings the familiarity of JavaScript to server-side HTML generation. For backend engineers, it provides a straightforward way to create dynamic content without the overhead of learning a complex templating language.

Whether you're building a traditional server-rendered application, creating reusable components through partials, or generating a static site, EJS offers a set of simple but powerful tools to get the job done efficiently.

By leveraging JavaScript's expressiveness within HTML templates, **EJS strikes a balance between flexibility and simplicity** that makes it a solid choice for many projects. 