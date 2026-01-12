import { supabase } from "../config/supabase.js"




export const uploadToSupabase =async (bucket,fileName,fileBuffer,mimetype) => {
    const {error:uploadError}=await supabase
    .storage
    .from(bucket).
    upload(fileName,fileBuffer,{
        contentType:mimetype,
        upsert:true
    })

    if (uploadError) throw uploadError

    const {data} =  supabase.storage.from(bucket).getPublicUrl(fileName)
    
    

    return data.publicUrl
}