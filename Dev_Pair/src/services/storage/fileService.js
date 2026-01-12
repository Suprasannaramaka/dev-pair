import { supabase } from '../../config/supabase.js';
import logger from '../../utils/logger.js';

// Upload file to Supabase Storage
export const uploadToSupabase = async (bucket, fileName, fileBuffer, mimeType) => {
    try {
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileBuffer, {
                contentType: mimeType,
                upsert: true,
                cacheControl: '3600'
            });

        if (uploadError) {
            logger.error('Supabase upload error:', uploadError);
            throw new Error(`Failed to upload file: ${uploadError.message}`);
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        logger.info('File uploaded to Supabase', {
            bucket,
            fileName,
            mimeType,
            url: publicUrl
        });

        return publicUrl;
    } catch (error) {
        logger.error('Upload to Supabase error:', error);
        throw error;
    }
};

// Delete file from Supabase Storage
export const deleteFromSupabase = async (bucket, fileName) => {
    try {
        const { error } = await supabase.storage
            .from(bucket)
            .remove([fileName]);

        if (error) {
            logger.error('Supabase delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }

        logger.info('File deleted from Supabase', { bucket, fileName });

        return true;
    } catch (error) {
        logger.error('Delete from Supabase error:', error);
        throw error;
    }
};

// List files in bucket
export const listFiles = async (bucket, path = '') => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path);

        if (error) throw error;

        return data || [];
    } catch (error) {
        logger.error('List files error:', error);
        throw error;
    }
};

// Get file metadata
export const getFileMetadata = async (bucket, fileName) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        if (error) throw error;

        return data;
    } catch (error) {
        logger.error('Get file metadata error:', error);
        throw error;
    }
};