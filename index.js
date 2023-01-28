import { Low, JSONFile } from "lowdb";
import express from "express";
import lodash from "lodash";
import { nanoid } from "nanoid";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import dotenv from "dotenv";
import cors from "cors"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "React Web Open API",
      version: "1.0.0",
      description: "A simple Express Open API for testing react applications",
    },
    servers: [
      {
        url: process.env.SERVER_HOST,
      },
    ],
  },
  apis: ["index.js"],
};
const specs = swaggerJsDoc(options);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())

const main = async () => {
  const adapter = new JSONFile("db.json");
  const db = new Low(adapter);
  app.db = db;
  await db.read();
  db.data ||= { persons: [] };
  /** Swagger route */
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));
  /**
   * @swagger
   * components:
   *   schemas:
   *     Person:
   *       type: object
   *       required:
   *         - firstname
   *         - middlename
   *         - lastname
   *         - email
   *       properties:
   *         id:
   *           type: string
   *           description: The auto-generated id of the book
   *         firstname:
   *           type: string
   *           description: Person first name
   *         middlename:
   *           type: string
   *           description: Person midlle name
   *         lastname:
   *           type: string
   *           description: Person last name
   *         email:
   *           type: string
   *           description: Person email
   *       example:
   *         firstname: Neljohn
   *         middlename: R
   *         lastname: Cerera
   *         email: john@gmail.com
   */

  /**
   * @swagger
   * tags:
   *   name: Persons
   *   description: The persons managing API
   */

  /** API Routes */
  /**
   * @swagger
   * /api/persons:
   *   get:
   *     summary: Returns the list of all persons
   *     tags: [Persons]
   *     responses:
   *       200:
   *         description: The list of all persons
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Person'
   */
  app.get("/api/persons", (req, res) => {
    try {
      /** Find all persons */
      db.chain = lodash.chain(db.data);
      const _persons = db.chain.get("persons").value();
      /** Response 200 */
      return res.status(200).json({
        data: _persons,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        success: false,
        messagae: "Internal Server error",
      });
    }
  });

  /**
   * @swagger
   * /api/persons/{id}:
   *   get:
   *     summary: Get the person by id
   *     tags: [Persons]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The person id
   *     responses:
   *       200:
   *         description: The person description by id
   *         contens:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Person'
   *       404:
   *         description: Person does not exist
   */
  app.get("/api/persons/:id", (req, res) => {
    try {
      /** Find person by id */
      db.chain = lodash.chain(db.data);
      const person = db.chain
        .get("persons")
        .find((p) => p.id === req.params.id)
        .value();
      if (!person) {
        /** Response 400 */
        res.status(404).json({
          data: null,
          success: false,
          messagae: "Person does not exist",
        });
        return;
      }

      /** Response 200 */
      return res.status(200).json({
        data: person,
        success: true,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        success: false,
        messagae: "Internal Server error",
      });
    }
  });
  /**
   * @swagger
   * /api/persons:
   *   post:
   *     summary: Create a new person
   *     tags: [Persons]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Person'
   *     responses:
   *       200:
   *         description: Created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Person'
   *       400:
   *         description: Email already in use
   *       500:
   *         description: Internal Server error
   */
  app.post("/api/persons", async (req, res) => {
    try {
      db.chain = lodash.chain(db.data);
      /** Check if email exist */
      const isPersonExist = db.chain
        .get("persons")
        .find((p) => p.email === req.body.email)
        .value();
      if (isPersonExist) {
        res.status(400).json({
          data: null,
          success: false,
          message: "Email already in use",
        });
        return;
      }
      /** Create person */
      db.data.persons.push({ id: nanoid(10), ...req.body });
      await db.write();
      /** Find Created person */
      const person = db.chain
        .get("persons")
        .find((p) => p.email === req.body.email)
        .value();
      /** Response 200 */
      return res.status(200).json({
        data: person,
        success: true,
        messagae: "Created successfully",
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        success: false,
        messagae: "Internal Server error",
      });
    }
  });
  /**
   * @swagger
   * /api/persons/{id}:
   *  put:
   *    summary: Update the Person by the id
   *    tags: [Persons]
   *    parameters:
   *      - in: path
   *        name: id
   *        schema:
   *          type: string
   *        required: true
   *        description: The person id
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            $ref: '#/components/schemas/Person'
   *    responses:
   *      200:
   *        description: Updated successfully
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/Person'
   *      404:
   *        description: Person does not exist
   *      500:
   *        description: Internal Server error
   */
  app.put("/api/persons/:id", async (req, res) => {
    try {
      db.chain = lodash.chain(db.data);
      /** Valdiate if person exist */
      const isPerson = db.chain
        .get("persons")
        .find({ id: req.params.id })
        .value();
      if (!isPerson) {
        /** Response 400 */
        res.status(404).json({
          data: null,
          success: false,
          messagae: "Person does not exist",
        });
        return;
      }
      /** Find person by id then update data */
      const person = db.chain
        .get("persons")
        .find({ id: req.params.id })
        .assign(req.body)
        .value();
      await db.write();
      /** Response 200 */
      return res.status(200).json({
        data: person,
        success: true,
        messagae: "Updated successfully",
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        success: false,
        messagae: "Internal Server error",
      });
    }
  });
  /**
   * @swagger
   * /api/persons/{id}:
   *   delete:
   *     summary: Remove person by id
   *     tags: [Persons]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The person id
   *
   *     responses:
   *       200:
   *         description: Deleted successfully
   *       404:
   *         description: Person does not exist
   *       500:
   *         description: Internal Server error
   */
  app.delete("/api/persons/:id", async (req, res) => {
    try {
      db.chain = lodash.chain(db.data);
      /** Valdiate if person exist */
      const isPerson = db.chain
        .get("persons")
        .find({ id: req.params.id })
        .value();
      if (!isPerson) {
        /** Response 400 */
        res.status(404).json({
          data: null,
          success: false,
          messagae: "Person does not exist",
        });
        return;
      }
      /** Find person by id then remove data from database */
      const person = db.chain
        .get("persons")
        .remove({ id: req.params.id })
        .value();
      await db.write();
      /** Response 200 */
      return res.status(200).json({
        data: person,
        success: true,
        messagae: "Deleted successfully",
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        success: false,
        messagae: "Internal Server error",
      });
    }
  });

  // Port
  app.listen(PORT, () => {
    console.log("Server is running and listening on port : ", PORT);
  });
};

main().catch((err) => {
  console.log("Main server error : ", err);
});
