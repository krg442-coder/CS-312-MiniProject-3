const express = require("express");
const pool = require("./db");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();


app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "drakul-blog-session-secret",
    resave: false,
    saveUninitialized: false
}));

app.set("view engine", "ejs");

const PORT = 3001;

// Show the sign-up page
app.get("/signup", (req, res) => {
    res.render("signup");
});

// Show the sign-in page
app.get("/signin", (req, res) => {
    res.render("signin");
});

// Create a new account
app.post("/signup", async (req, res) => {
    try {
        const { user_id, name, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (user_id, password, name)
             VALUES ($1, $2, $3)
             RETURNING user_id, name`,
            [user_id, hashedPassword, name]
        );

        req.session.userId = result.rows[0].user_id;
        req.session.userName = result.rows[0].name;

        res.redirect("/");
    } catch (error) {
        if (error.code === "23505") {
            return res.status(400).send(
                "That username is already taken. Please choose another."
            );
        }

        console.error(error);
        res.status(500).send("Error creating your account.");
    }
});

// Sign in to an existing account
app.post("/signin", async (req, res) => {
    try {
        const { user_id, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE user_id = $1",
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(401).send("Invalid username or password.");
        }

        const user = result.rows[0];
        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).send("Invalid username or password.");
        }

        req.session.userId = user.user_id;
        req.session.userName = user.name;

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error signing in.");
    }
});

app.get("/", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM blogs ORDER BY date_created DESC"
        );

        const posts = result.rows.map(post => ({
            id: post.blog_id,
            creator: post.creator_name,
            creatorUserId: post.creator_user_id,
            title: post.title,
            blog: post.body,
            time: post.date_created
}));

        res.render("index", {
            posts: posts,
            userId: req.session.userId,
            userName: req.session.userName
});
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading blog posts.");
    }
});

// Post creation
app.post("/create-post", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    try {
        await pool.query(
            `INSERT INTO blogs
            (creator_name, creator_user_id, title, body)
            VALUES ($1, $2, $3, $4)`,
            [
                req.session.userName,
                req.session.userId,
                req.body.postTitle,
                req.body.blog
            ]
        );

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating blog post.");
    }
});

// Get a post for editing
app.get("/edit-post/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    try {
        const result = await pool.query(
            `SELECT * FROM blogs
             WHERE blog_id = $1 AND creator_user_id = $2`,
            [req.params.id, req.session.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).send("Post not found or access denied.");
        }

        const row = result.rows[0];

        const post = {
            id: row.blog_id,
            creator: row.creator_name,
            title: row.title,
            blog: row.body
        };

        res.render("edit", { post: post });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading post.");
    }
});

// Save an edited post
app.post("/edit-post/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    try {
        const result = await pool.query(
            `UPDATE blogs
             SET title = $1, body = $2
             WHERE blog_id = $3 AND creator_user_id = $4`,
            [
                req.body.postTitle,
                req.body.blog,
                req.params.id,
                req.session.userId
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Post not found or access denied.");
        }

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating post.");
    }
});

// Delete a post
app.post("/delete-post/:id", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/signin");
    }

    try {
        const result = await pool.query(
            `DELETE FROM blogs
             WHERE blog_id = $1 AND creator_user_id = $2`,
            [req.params.id, req.session.userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).send("Access denied.");
        }

        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting post.");
    }
});

// Sign out
app.post("/signout", (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Error signing out.");
        }

        res.redirect("/");
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});