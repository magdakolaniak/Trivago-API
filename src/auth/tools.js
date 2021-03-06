import jwt from 'jsonwebtoken';
import UserModel from '../users/schema.js';

export const JWTAuthenticate = async (author) => {
  const accessToken = await generateJWT({ _id: author._id });
  const refreshToken = await generateRefreshJWT({ _id: author._id });
  author.refreshToken = refreshToken;
  await author.save();
  return { accessToken, refreshToken };
};

const generateJWT = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1 week' },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      }
    )
  );

export const verifyToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) reject(err);

      resolve(decodedToken);
    })
  );

const generateRefreshJWT = (payload) =>
  new Promise((resolve, reject) =>
    jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '1 day' },
      (err, token) => {
        if (err) reject(err);

        resolve(token);
      }
    )
  );
const verifyRefreshToken = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, process.env.JWT_REFRESH_SECRET, (err, decodedToken) => {
      if (err) reject(err);

      resolve(decodedToken);
    })
  );
export const refreshTokens = async (actualRefreshToken) => {
  const content = await verifyRefreshToken(actualRefreshToken);

  const user = await UserModel.findById(content._id);

  if (!user) throw new Error('User not found');

  if (user.refreshToken === actualRefreshToken) {
    const newAccessToken = await generateJWT({ _id: user._id });

    const newRefreshToken = await generateRefreshJWT({ _id: user._id });

    user.refreshToken = newRefreshToken;

    await user.save();

    return { newAccessToken, newRefreshToken };
  } else {
    throw new Error('Refresh Token not valid!');
  }
};
