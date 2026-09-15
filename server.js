const express = require("express");

const app = express();
const posts = [];

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

const PORT = 3001;

app.get("/", (req, res) => {
    res.render("index", {posts: posts});
});

// Post creation
app.post("/create-post", (req, res) => {
    const newPost = {
        id: Date.now(),
        creator: req.body.creator,
        title: req.body.postTitle,
        blog: req.body.blog,
        time: new Date()
    };

    posts.push(newPost);

    res.redirect("/");
});

// Get info on exact edit ID (Using date)
app.get("/edit-post/:id", (req, res) => {
    // Finds original post
    const post = posts.find(post => post.id == req.params.id);

    res.render("edit", { post: post });
});

// Republish as an Edit
app.post("/edit-post/:id", (req, res) => {
    // Replaces original post
    const post = posts.find(post => post.id == req.params.id);

    post.creator = req.body.creator;
    post.title = req.body.postTitle;
    post.blog = req.body.blog;

    res.redirect("/");
});

// Deleting a post
app.post("/delete-post/:id", (req, res) => {
    const postIndex = posts.findIndex(post => post.id == req.params.id);

    posts.splice(postIndex, 1);

    res.redirect("/");
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
