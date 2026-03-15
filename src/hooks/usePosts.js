import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function usePosts(userId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error, count: total } = await supabase
      .from("posts")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) {
      setPosts(data || []);
      setCount(total || 0);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const addPost = async (postData) => {
    const { data, error } = await supabase
      .from("posts")
      .insert({ ...postData, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    setPosts((prev) => [data, ...prev]);
    setCount((c) => c + 1);
    return data;
  };

  const updatePost = async (id, updates) => {
    const { data, error } = await supabase
      .from("posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    setPosts((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  };

  const deletePost = async (id) => {
    const { error } = await supabase.from("posts").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setCount((c) => c - 1);
  };

  const uploadScreenshot = async (file) => {
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("screenshots").upload(path, file);
    if (error) throw error;
    return path;
  };

  return { posts, loading, count, addPost, updatePost, deletePost, uploadScreenshot, refresh: fetchPosts };
}
