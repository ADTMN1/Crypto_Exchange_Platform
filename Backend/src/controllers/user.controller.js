import cloudinary from '../config/cloudinary.config.js';
import pool from '../config/db.config.js';
import AppError from '../utils/errorHandling.js';

const userController = {
  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        'SELECT id, email, username, profile_image FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return next(new AppError('User not found', 404));
      }

      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone } = req.body;

      const username = `${firstName || ''} ${lastName || ''}`.trim();

      const result = await pool.query(
        'UPDATE users SET username = $1, email = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, username, profile_image',
        [username, email, phone, userId]
      );

      if (result.rows.length === 0) {
        return next(new AppError('User not found', 404));
      }

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      next(error);
    }
  },

  // Upload profile image
  async uploadProfileImage(req, res, next) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return next(new AppError('No image file provided', 400));
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'crypto_exchange/profiles',
          public_id: `user_${userId}`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
          ],
        },
        async (error, result) => {
          if (error) {
            return next(new AppError('Failed to upload image', 500));
          }

          try {
            const dbResult = await pool.query(
              'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, username, profile_image',
              [result.secure_url, userId]
            );

            if (dbResult.rows.length === 0) {
              return next(new AppError('User not found', 404));
            }

            res.json({
              message: 'Profile image uploaded successfully',
              imageUrl: result.secure_url,
              user: dbResult.rows[0],
            });
          } catch (dbError) {
            next(new AppError('Failed to update profile image in database', 500));
          }
        }
      );

      const { Readable } = await import('stream');
      Readable.from(req.file.buffer).pipe(uploadStream);
    } catch (error) {
      next(error);
    }
  },

  // Delete profile image
  async deleteProfileImage(req, res, next) {
    try {
      const userId = req.user.id;

      const userResult = await pool.query(
        'SELECT profile_image FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return next(new AppError('User not found', 404));
      }

      const profileImage = userResult.rows[0].profile_image;

      if (profileImage) {
        const publicId = `crypto_exchange/profiles/user_${userId}`;
        await cloudinary.uploader.destroy(publicId);
      }

      await pool.query(
        'UPDATE users SET profile_image = NULL, updated_at = NOW() WHERE id = $1',
        [userId]
      );

      res.json({ message: 'Profile image deleted successfully' });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
