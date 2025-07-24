import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
  try {
    // Ganti nama variabel lokal supaya tidak sama dengan nama fungsi
    const tokenFromCookie = req.cookies.refreshToken;
    if (!tokenFromCookie) return res.sendStatus(401);

    const user = await Users.findAll({
      where: {
        refresh_token: tokenFromCookie
      }
    });

    if (!user[0]) return res.sendStatus(403);

    jwt.verify(tokenFromCookie, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const userId = user[0].id;
      const name = user[0].name;
      const email = user[0].email;

      const accessToken = jwt.sign(
        { userId, name, email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '1m' }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
};
