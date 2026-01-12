import { supabase, supabaseAdmin } from "../config/supabase.js";
import { deleteFromSupabase } from "../utils/deleteFromSupabase.js";
import { generateFileName, updateTimestamp } from "../utils/helpers.js";
import { uploadToSupabase } from "../utils/uploadToSupabase.js";



export const signup = async (req, res) => {
  try {
    const { email, password, name, role = 'student' } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields (email, password, name, role) are required",
      });
    }

    const { data, error: existingError } = await supabase
      .from("users")
      .select('*')
      .eq('email', email).single()



    if (data) {
      return res.json({
        success: false,
        message: "User already registered"
      })
    }

    // Supabase Auth me user create karo with metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role, // ✅ metadata me store
        },
      },
    });

    if (authError) {
      return res.status(400).json({ success: false, message: authError.message });
    }

    const userId = authData.user.id;

    // 2️⃣ Custom "users" table me record insert karo
    const { error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          name,
          email,
          role, // ✅ table me bhi store
        },
      ]);

    if (profileError) {
      return res.status(400).json({ success: false, message: profileError.message });
    }

    // 3️⃣ Response
    res.status(201).json({
      success: true,
      message: "Signup successful! Please verify your email.",
      user: authData.user,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};





// 🟢 Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email & password required" });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user
    const user_metadata = user.user_metadata

    const loginUser = {
      id: user.id,
      email: user_metadata.email,
      name: user_metadata.name,
      role: user_metadata.role,
      image: user_metadata.image
    }

    const token = data.session?.access_token;

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === 'development' ? 'lax' : "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, message: "Login successful", loginUser});
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🟢 Get Profile
export const profile = async (req, res) => {
  try {
    const user = req.user; // from middleware
    const user_metadata = user.user_metadata


    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return res.status(400).json({ error: profileError.message });
    }


    res.json({ success: true, profile });
  } catch (err) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// 🟢 Logout
export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const { id } = req.user
  const file = req.file
  if (!file) {
    return res.json({
      success: false,
      message: "No file found"
    })
  }

  
  const fileName = generateFileName(id,file.originalname)


  const image = await uploadToSupabase(
    'profile_image',
    fileName,
    file.buffer,
    file.mimetype
  )
  
  const { data, error } = await supabase
  .from("users")
  .update({ image })
  .eq("id", id)
  .select()
  .single();

if (error) throw error;

// 👇 Update auth metadata
await supabaseAdmin.auth.admin.updateUserById(id, {
  user_metadata: {
    image: image
  }
});

  res.json({
    success:true,
    message:'Profile image added  successfully'
  })

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  


}




export const deleteProfileImage = async (req, res) => {
  try {
    const { id } = req.user;

    // 1️⃣ Fetch user image URL
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("image")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!user.image) return res.json({ success: false, message: "No image found" });

    // 2️⃣ Extract file name
    const fileName = user.image.split("/").pop();

    // 3️⃣ Delete from Supabase
    await deleteFromSupabase("profile_image", fileName);

    // 4️⃣ Update users table
    await supabase.from("users").update({ image: null }).eq("id", id);

    res.json({ success: true, message: "Profile image deleted successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user;
    const { name } = req.body;

    // Agar user ne kuch bhi update nahi bheja
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nothing to update",
      });
    }

    // 1️⃣ Update custom users table
    const { data, error } = await supabase
      .from("users")
      .update({
        name,
        updated_at: updateTimestamp(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // 2️⃣ Update Supabase Auth metadata
    await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: {
        name,
      },
    });

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: data,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendResetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/update-password`, // frontend link yha frontend link dalna hai baad mein 
    });

    if (error) throw error;

    return res.json({
      success: true,
      message: "Reset password link sent to your email",
      link: "http://localhost:5000/api/auth/update-password"
    });
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    });
  }
};