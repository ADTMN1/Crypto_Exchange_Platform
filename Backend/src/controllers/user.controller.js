import cloudinary from '../config/cloudinary.config.js';
import pool from '../config/db.config.js';

const userController = {
  // Get user profile
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        'SELECT id, email, username, profile_image FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Failed to fetch profile' });
    }
  },

  // Update user profile
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { firstName, lastName, email, phone } = req.body;

      // Combine first and last name into username
      const username = `${firstName || ''} ${lastName || ''}`.trim();

      const result = await pool.query(
        'UPDATE users SET username = $1, email = $2, phone = $3, updated_at = NOW() WHERE id = $4 RETURNING id, email, username, profile_image',
        [username, email, phone, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Failed to update profile' });
    }
  },

  // Upload profile image
  async uploadProfileImage(req, res) {
    try {
      const userId = req.user.id;
      console.log('📸 Upload request received for user:', userId);

      if (!req.file) {
        console.log('❌ No file in request');
        return res.status(400).json({ message: 'No image file provided' });
      }

      console.log('📁 File details:', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      });

      // Upload image to Cloudinary using buffer
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
            console.error('❌ Cloudinary upload error:', error);
            return res.status(500).json({ message: 'Failed to upload image' });
          }

          console.log('✅ Cloudinary upload successful:', result.secure_url);

          try {
            // Update user's profile_image in database
            const dbResult = await pool.query(
              'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, username, profile_image',
              [result.secure_url, userId]
            );

            console.log('✅ Database updated:', dbResult.rows[0]);

            res.json({
              message: 'Profile image uploaded successfully',
              imageUrl: result.secure_url,
              user: dbResult.rows[0],
            });
          } catch (dbError) {
            console.error('❌ Database update error:', dbError);
            res.status(500).json({ message: 'Failed to update profile image in database' });
          }
        }
      );

      // Pipe the buffer to Cloudinary
      const { Readable } = await import('stream');
      Readable.from(req.file.buffer).pipe(uploadStream);
    } catch (error) {
      console.error('❌ Upload profile image error:', error);
      res.status(500).json({ message: 'Failed to upload profile image' });
    }
  },

  // Delete profile image
  async deleteProfileImage(req, res) {
    try {
      const userId = req.user.id;

      // Get current profile image
      const userResult = await pool.query(
        'SELECT profile_image FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const profileImage = userResult.rows[0].profile_image;

      // Delete from Cloudinary if exists
      if (profileImage) {
        const publicId = `crypto_exchange/profiles/user_${userId}`;
        await cloudinary.uploader.destroy(publicId);
      }

      // Remove from database
      await pool.query(
        'UPDATE users SET profile_image = NULL, updated_at = NOW() WHERE id = $1',
        [userId]
      );

      res.json({ message: 'Profile image deleted successfully' });
    } catch (error) {
      console.error('Delete profile image error:', error);
      res.status(500).json({ message: 'Failed to delete profile image' });
    }
  },
};

export default userController;
