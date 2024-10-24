const db = require("../config.js");

const addProduct = (req, res) => {
  const {
    name,
    description,
    sale,
    main_product_type,
    product_type,
    season,
    brandID,
    BagTypeID,
    Bagvariants,
    Fragrancevariants,
    WatchTypeID,
    FragranceTypeID,
    size, // Optional for watch
    available, // Optional for watches
    before_price,
    after_price,
    instock,
  } = req.body;
  // Handle image files
  const images = req.files; // Get all uploaded images
  // Insert into product table
  const productQuery = `
        INSERT INTO product (name, description, sale, main_product_type, product_type, season, brandID, instock)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    productQuery,
    [
      name,
      description,
      sale,
      main_product_type,
      product_type,
      season,
      brandID,
      instock,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const lastProductId = result.insertId; // Get the last inserted product ID
      // Check if images were uploaded
      if (images && images.length > 0) {
        // Insert image paths into product_images table
        const imageQueries = images.map((image) => {
          return new Promise((resolve, reject) => {
            const insertImageQuery = `INSERT INTO product_images (ProductID, img) VALUES (?, ?)`;
            db.query(
              insertImageQuery,
              [lastProductId, image.filename],
              (err) => {
                if (err) reject(err);
                resolve();
              }
            );
          });
        });

        Promise.all(imageQueries)
          .then(() => {
            // Now handle the specific product type insertion
            handleProductTypeInsertion(
              main_product_type,
              lastProductId,
              BagTypeID,
              Bagvariants,
              Fragrancevariants,
              WatchTypeID,
              FragranceTypeID,
              size,
              available,
              before_price,
              after_price,
              res
            );
          })
          .catch((err) => res.status(500).json({ error: err.message }));
      } else {
        // If no images were uploaded, just proceed with product type insertion
        handleProductTypeInsertion(
          main_product_type,
          lastProductId,
          BagTypeID,
          Bagvariants,
          Fragrancevariants,
          WatchTypeID,
          FragranceTypeID,
          size,
          available,
          before_price,
          after_price,
          res
        );
      }
    }
  );
};
const handleProductTypeInsertion = (
  main_product_type,
  lastProductId,
  BagTypeID,
  Bagvariants,
  Fragrancevariants,
  WatchTypeID,
  FragranceTypeID,
  size,
  available,
  before_price,
  after_price,
  res
) => {
  if (main_product_type === "Bag") {
    const insertBagQuery = `INSERT INTO bags (BagTypeID, ProductID) VALUES (?, ?)`;
    db.query(insertBagQuery, [BagTypeID, lastProductId], (err, bagResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const lastBagId = bagResult.insertId; // Get the last inserted BagID
      // Insert Bagvariants into bagvariants
      if (Bagvariants && Bagvariants.length > 0) {
        const variantQueries = Bagvariants.map((variant) => {
          return new Promise((resolve, reject) => {
            const variantQuery = `INSERT INTO bagvariants (BagID, Size, Color, Available, before_price, after_price) VALUES (?, ?, ?, ?, ?, ?)`;
            db.query(
              variantQuery,
              [
                lastBagId,
                variant.size,
                variant.color,
                variant.available,
                variant.before_price,
                variant.after_price,
              ],
              (err) => {
                if (err) reject(err);
                resolve();
              }
            );
          });
        });

        Promise.all(variantQueries)
          .then(() =>
            res
              .status(201)
              .json({ message: "Product and variants added as Bag." })
          )
          .catch((err) => res.status(500).json({ error: err.message }));
      } else {
        res
          .status(201)
          .json({ message: "Product added as Bag without variants." });
      }
    });
  } else if (main_product_type === "Watch") {
    const insertWatchQuery = `INSERT INTO watches (WatchTypeID, ProductID, Available, before_price, after_price) VALUES (?, ?, ?, ?, ?)`;
    db.query(
      insertWatchQuery,
      [
        WatchTypeID,
        lastProductId,
        available || "Yes",
        before_price,
        after_price,
      ],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: "Product added as Watch." });
      }
    );
  } else if (main_product_type === "Fragrance") {
    const insertFragranceQuery = `INSERT INTO fragrances (FragranceTypeID, ProductID) VALUES (?, ?)`;
    db.query(
      insertFragranceQuery,
      [FragranceTypeID, lastProductId],
      (err, fragranceResult) => {
        if (err) return res.status(500).json({ error: err.message });

        const lastFragranceId = fragranceResult.insertId; // Get the last inserted BagID
        // Insert Bagvariants into bagvariants
        if (Fragrancevariants && Fragrancevariants.length > 0) {
          const variantQueries = Fragrancevariants.map((fragvariant) => {
            return new Promise((resolve, reject) => {
              const variantQuery = `INSERT INTO fragrancevariants (FragranceID, Size, Available, before_price, after_price) VALUES (?, ?, ?, ?, ?)`;
              db.query(
                variantQuery,
                [
                  lastFragranceId,
                  fragvariant.size,
                  fragvariant.available,
                  fragvariant.before_price,
                  fragvariant.after_price,
                ],
                (err) => {
                  if (err) reject(err);
                  resolve();
                }
              );
            });
          });

          Promise.all(variantQueries)
            .then(() =>
              res
                .status(201)
                .json({ message: "Product and variants added as Fragrance." })
            )
            .catch((err) => res.status(500).json({ error: err.message }));
        } else {
          res
            .status(201)
            .json({ message: "Product added as Bag without variants." });
        }
      }
    );
  } else {
    res.status(400).json({ error: "Invalid main product type." });
  }
};

// const getProductDetails = (req, res) => {
//   const productId = req.params.id;

//   // Query to get the product details
//   const productQuery = `
//     SELECT p.*, b.BagTypeID, w.WatchTypeID, f.FragranceTypeID, br.brand_name AS brand_name
//     FROM product p
//     LEFT JOIN bags b ON p.id = b.ProductID
//     LEFT JOIN watches w ON p.id = w.ProductID
//     LEFT JOIN fragrances f ON p.id = f.ProductID
//     LEFT JOIN brands br ON p.brandID = br.id
//     WHERE p.id = ?`;

//   db.query(productQuery, [productId], (err, productResults) => {
//     if (err) return res.status(500).json({ error: err.message });

//     if (productResults.length === 0) {
//       return res.status(404).json({ error: "Product not found." });
//     }

//     const product = productResults[0];

//     // Query to get product images
//     const imagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;

//     db.query(imagesQuery, [productId], (err, imageResults) => {
//       if (err) return res.status(500).json({ error: err.message });

//       // Query to get variants based on the product type
//       let variantsQuery = "";
//       if (product.main_product_type === "Bag") {
//         variantsQuery = `
//           SELECT Size, Color, Available, before_price, after_price 
//           FROM bagvariants 
//           WHERE BagID = (SELECT BagID FROM bags WHERE ProductID = ?)`;
//       } else if (product.main_product_type === "Watch") {
//         variantsQuery = `
//           SELECT Available, before_price, after_price 
//           FROM watches 
//           WHERE ProductID = ?`;
//       } else if (product.main_product_type === "Fragrance") {
//         variantsQuery = `
//           SELECT Size, Available, before_price, after_price 
//           FROM fragrancevariants 
//           WHERE FragranceID = (SELECT FragranceID FROM fragrances WHERE ProductID = ?)`;
//       }

//       if (variantsQuery) {
//         db.query(variantsQuery, [productId], (err, variantResults) => {
//           if (err) return res.status(500).json({ error: err.message });

//           // Prepare the response object
//           const response = {
//             product,
//             images: imageResults.map((img) => img.img),
//             variants: [],
//           };

//           // To track sizes across all colors
//           const sizeMap = {};

//           if (variantResults.length > 0) {
//             // Process variants based on product type
//             if (product.main_product_type === "Bag") {
//               variantResults.forEach(({ Color, Size, Available, before_price, after_price }) => {
//                 if (Available === "Yes") {
//                   if (!sizeMap[Size]) {
//                     sizeMap[Size] = { size: Size, prices: [] };
//                   }
//                   sizeMap[Size].prices.push({
//                     color: Color,
//                     before_price,
//                     after_price,
//                   });
//                 }
//               });
//             } else if (product.main_product_type === "Fragrance") {
//               variantResults.forEach(({ Size, Available, before_price, after_price }) => {
//                 if (!sizeMap[Size]) {
//                   sizeMap[Size] = { size: Size, prices: [] };
//                 }
//                 sizeMap[Size].prices.push({
//                   before_price,
//                   after_price,
//                   available: Available === "Yes" // Add availability status
//                 });
//               });
//             } else if (product.main_product_type === "Watch") {
//               variantResults.forEach(({ Available, before_price, after_price }) => {
//                 if (Available === "Yes") {
//                   response.variants.push({
//                     before_price,
//                     after_price,
//                   });
//                 }
//               });
//               return res.status(200).json(response); // Return immediately after sending response
//             }
//           }
//           // Transform sizeMap into the desired response format
//           response.variants = Object.values(sizeMap).map(({ size, prices }) => ({
//             size,
//             prices,
//           }));

//           res.status(200).json(response);
//         });
//       } else {
//         res.status(200).json({
//           product,
//           images: imageResults.map((img) => img.img),
//           variants: [], // No variants
//         });
//       }
//     });
//   });
// };
const getProductDetails = async (req, res) => {
  const productId = req.params.id;

  // Query to get the product details
  const productQuery = `
    SELECT p.*, b.BagTypeID, w.WatchTypeID, f.FragranceTypeID, br.brand_name AS brand_name
    FROM product p
    LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN watches w ON p.id = w.ProductID
    LEFT JOIN fragrances f ON p.id = f.ProductID
    LEFT JOIN brands br ON p.brandID = br.id
    WHERE p.id = ?`;

  try {
    const [productResults] = await db.promise().query(productQuery, [productId]);

    if (productResults.length === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    const product = productResults[0];

    // Query to get product images
    const imagesQuery = `SELECT img FROM product_images WHERE ProductID = ?`;
    const [imageResults] = await db.promise().query(imagesQuery, [productId]);

    // Query to get variants based on the product type
    let variantsQuery = "";
    if (product.main_product_type === "Bag") {
      variantsQuery = `
        SELECT Size, Color, Available, before_price, after_price 
        FROM bagvariants 
        WHERE BagID = (SELECT BagID FROM bags WHERE ProductID = ?)`;
    } else if (product.main_product_type === "Watch") {
      variantsQuery = `
        SELECT Available, before_price, after_price 
        FROM watches 
        WHERE ProductID = ?`;
    } else if (product.main_product_type === "Fragrance") {
      variantsQuery = `
        SELECT Size, Available, before_price, after_price 
        FROM fragrancevariants 
        WHERE FragranceID = (SELECT FragranceID FROM fragrances WHERE ProductID = ?)`;
    }

    // Execute the variants query if applicable
    let variantResults = [];
    if (variantsQuery) {
      [variantResults] = await db.promise().query(variantsQuery, [productId]);
    }

    // Prepare the response object
    const response = {
      product,
      images: imageResults.map((img) => img.img),
      variants: [],
    };

    // Process variants based on product type
    const sizeMap = {};
    if (variantResults.length > 0) {
      if (product.main_product_type === "Bag") {
        variantResults.forEach(({ Color, Size, Available, before_price, after_price }) => {
          if (Available === "Yes") {
            if (!sizeMap[Size]) {
              sizeMap[Size] = { size: Size, prices: [] };
            }
            sizeMap[Size].prices.push({ color: Color, before_price, after_price });
          }
        });
      } else if (product.main_product_type === "Fragrance") {
        variantResults.forEach(({ Size, Available, before_price, after_price }) => {
          if (!sizeMap[Size]) {
            sizeMap[Size] = { size: Size, prices: [] };
          }
          sizeMap[Size].prices.push({
            before_price,
            after_price,
            available: Available === "Yes",
          });
        });
      } else if (product.main_product_type === "Watch") {
        variantResults.forEach(({ Available, before_price, after_price }) => {
          if (Available === "Yes") {
            response.variants.push({ before_price, after_price });
          }
        });
        return res.status(200).json(response);
      }
    }

    // Transform sizeMap into the desired response format
    response.variants = Object.values(sizeMap).map(({ size, prices }) => ({
      size,
      prices,
    }));

    res.status(200).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getProducts = (req, res) => {
  const { main_product_type } = req.params;

  const productQuery = `
    SELECT 
      p.id, 
      p.name, 
      p.main_product_type, 
      p.sale, 
      p.instock,
      fv.size,
      br.brand_name,
      (SELECT img FROM product_images WHERE ProductID = p.id LIMIT 1) AS first_image,
      (SELECT img FROM product_images WHERE ProductID = p.id ORDER BY id LIMIT 1 OFFSET 1) AS second_image,
      COALESCE(MIN(bv.Size), MIN(fv.Size)) AS size,
      COALESCE(MIN(bv.after_price), MIN(fv.after_price), MIN(w.after_price)) AS after_price,
      COALESCE(MIN(bv.before_price), MIN(fv.before_price), MIN(w.before_price)) AS before_price
    FROM product p
    LEFT JOIN bags b ON p.id = b.ProductID
    LEFT JOIN bagvariants bv ON b.BagID = bv.BagID
    LEFT JOIN fragrances f ON p.id = f.ProductID  
    LEFT JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID
    LEFT JOIN watches w ON p.id = w.ProductID
    LEFT JOIN brands br ON p.BrandID = br.id
    WHERE p.main_product_type = ?
    GROUP BY p.id`;

  db.query(productQuery, [main_product_type], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formattedResults = results.map(({ id, name, main_product_type, sale, instock, size, brand_name, first_image, second_image, after_price, before_price }) => ({
      id,
      name,
      main_product_type,
      sale,
      instock,
      size:size,
      brand_name:brand_name,
      first_image,
      second_image,
      after_price: after_price || null,
      before_price: before_price || null,
    }));

    res.status(200).json(formattedResults);
  });
};


const deleteProduct = (req, res) => {
  const { id } = req.params;
  const sqlDelete = "DELETE FROM product WHERE id = ? ";
  db.query(sqlDelete, [id], (err, result) => {
    if (err) {
      return res.json({ message: err.message });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "No matching record found to delete" });
    }
    res.status(200).json({ message: "product deleted successfully" });
  });
};
const getProductBysubType = (req, res) => {
  const { type, subtype } = req.query;

  let query;
  let params = [];

  if (type === "Fragrance") {
    query = `
      SELECT p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price, MIN(pi.img) AS first_image 
      FROM product p 
      JOIN fragrances f ON p.id = f.ProductID 
      JOIN fragrancevariants fv ON f.FragranceID = fv.FragranceID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE f.FragranceTypeID = ? 
      GROUP BY p.id, p.name, p.sale, p.instock, p.brandID, br.brand_name, fv.Size, fv.before_price, fv.after_price`;
    params.push(subtype);
  } else if (type === "Bags") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN bags b ON p.id = b.ProductID 
      JOIN bagvariants bv ON b.BagID = bv.BagID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE b.BagTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, bv.Size, bv.before_price, bv.after_price`;
    params.push(subtype);
  } else if (type === "Watches") {
    query = `
      SELECT p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price,
      MIN(pi.img) AS first_image 
      FROM product p  
      JOIN watches w ON p.id = w.ProductID 
      JOIN product_images pi ON p.id = pi.ProductID 
      JOIN brands br ON p.brandID = br.id 
      WHERE w.WatchTypeID = ? 
      GROUP BY p.id, p.name, p.instock, p.brandID, br.brand_name, w.before_price, w.after_price`;
    params.push(subtype);
  } else {
    return res.status(400).json({ error: "Invalid product type" });
  }

  db.query(query, params, (error, results) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Create a map to group results by product
    const productsMap = {};

    results.forEach(result => {
      const { id, name, sale, instock, brandID, brand_name, Size, before_price, after_price, first_image } = result;

      // If product doesn't exist in the map, create a new entry
      if (!productsMap[id]) {
        productsMap[id] = {
          id,
          name,
          sale,
          instock,
          brandID,
          brand_name,
          first_image,
          sizes: [],
        };
      }

      // Push size details for each product
      productsMap[id].sizes.push({
        Size,
        before_price,
        after_price,
      });
    });

    // Convert the map to an array of products
    const finalResults = Object.values(productsMap);
    res.json(finalResults);
  });
};

module.exports = {
  addProduct,
  getProductDetails,
  getProducts,
  deleteProduct,
  getProductBysubType,
};
