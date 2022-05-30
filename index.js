console.clear();
const fastify = require("fastify")();
const fastifyStatic = require("fastify-static");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

if (!process.env.PORT && !fs.existsSync("./.env")) {
  console.error(
    "\x1b[31m",
    "[ERROR]",
    "\x1b[0m",
    "The .env file could not be found.\nPlease check README.md for more information"
  );
  process.exit(1);
}
if (!process.env.KEY || process.env.KEY === "CHANGE_ME") {
  console.warn(
    "\x1b[33m",
    "[WARNING]",
    "\x1b[0m",
    "Your key has not been set.\nPlease check your .env configuration."
  );
}
if (
  process.env.LOGO_FILE_NAME &&
  !fs.existsSync(`assets/images/${process.env.LOGO_FILE_NAME}`)
) {
  console.warn(
    "\x1b[33m",
    "[WARNING]",
    "\x1b[0m",
    "The logo file could not be found.\nPlease check your .env configuration."
  );
}

fastify.register(require("fastify-helmet"), {
  contentSecurityPolicy: false,
});

fastify.register(require("point-of-view"), {
  engine: {
    ejs: require("ejs"),
  },
});

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "assets"),
  prefix: "/assets",
});

fastify.register(require("fastify-formbody"));

fastify.register(fastifyStatic, {
  root: path.join(__dirname, "images"),
  prefix: "/image",
  decorateReply: false,
});

fastify.register(require("fastify-file-upload"));
const types = ["", ".png", ".jpg", ".jpeg"];
let Fpath = "";
let Ftype = "";
let Fsize = "";
let Fdate = "";
fastify.post("/", async (req, res) => {
  try {
    if (req.headers.key !== process.env.KEY) {
      return res.status(403).send({ status: 403, message: "Invalid token" });
    }
    const file = req.body?.file;

    if (!file) {
      return res.status(404).send({
        status: 404,
        message: "No file uploaded",
      });
    }
    const safeSuffix = path
      .normalize(file.name)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const safeJoin = path.join("./images/", safeSuffix);
    file.mv(safeJoin);
    res.send({
      status: 200,
      message: "File just got uploaded!",
      url: safeSuffix,
    });
    if (process.env.ADVANCED_LOGGING === "true") {
      console.log(`File ${safeSuffix} uploaded!`);
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json(e);
  }
});
fastify.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send("User-agent: *\nAllow: /$\nDisallow: /");
});
fastify.get("/admin", (req, res) => {
  res.view("views/login");
});
fastify.post("/admin", (req, res) => {
  if (req.body.password === process.env.KEY) {
    let images = [];
    fs.readdirSync("images/").forEach((image) => {
      images.push({
        fullPath: image,
        size: fs.statSync(`images/${image}`).size / 1000,
        date: fs.statSync(`images/${image}`).mtime.toLocaleDateString("en-US"),
      });
    });
    images.sort((a, b) => a - b);
    const totalSize = images.reduce(
      (previousValue, initialValue) => previousValue + initialValue.size,
      0
    );
    const statistics = {
      totalNb: images.length,
      mostRecentUpload: images[0].date,
      totalSize:
        totalSize > 1000
          ? `${Math.round((totalSize * 100) / 1000) / 100} MB`
          : `${Math.round(totalSize * 100) / 100} KB`,
    };
    images = images.map((image) =>
      image.size > 1000
        ? {
            ...image,
            size: `${Math.round((image.size * 100) / 1000) / 100} MB`,
          }
        : {
            ...image,
            size: `${Math.round(image.size * 100) / 100} KB`,
          }
    );
    console.log("Login successful!");
    res.view("views/admin", {
      statistics,
      images,
      fileExists: fs.existsSync,
    });
  } else {
    console.log("Failed to login!");
    res.view("views/404", {
      path: req.url,
    });
  }
});
fastify.get("/", (req, res) => {
  res.view("views/index", {
    path: req.url,
  });
});
fastify.get("/:image", (req, res) => {
  Fpath = "";
  Ftype = "";
  types.forEach((i) => {
    if (fs.existsSync(`images/${req.url}${i}`)) {
      const size = fs.statSync(`images/${req.url}${i}`).size / 1000;
      Fpath = req.url;
      Ftype = i;
      Fsize =
        size > 1000
          ? `${Math.round((size * 100) / 1000) / 100} MB`
          : `${Math.round(size * 100) / 100} KB`;
      Fdate = fs
        .statSync(`images/${req.url}${i}`)
        .mtime.toLocaleDateString("en-US");
    }
  });
  const fullPath = Fpath + Ftype;
  if (fullPath !== "" && fs.existsSync(`images/${fullPath}`)) {
    res.view("views/image", {
      path: Fpath,
      type: Ftype,
      fullPath,
      size: Fsize,
      date: Fdate,
      fileExists: fs.existsSync,
    });
    if (process.env.ADVANCED_LOGGING === "true" && fullPath) {
      console.log(`File ${fullPath} viewed!`);
    }
  } else {
    res.view("views/404", {
      path: req.url,
    });
  }
});

fastify.listen(process.env.PORT, (err) => {
  if (err) {
    throw new Error(err);
  }
  console.log(
    "\x1b[32m",
    "[READY]",
    "\x1b[0m",
    `ImageWebServer running on ${process.env.DOMAIN}, using port ${process.env.PORT}!`
  );
});
