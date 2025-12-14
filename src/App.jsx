import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot, doc, setDoc } from "firebase/firestore";
import { auth, loginWithGoogle, logout } from "./firebaseAuth";
import { onAuthStateChanged } from "firebase/auth";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [shoppingList, setShoppingList] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({});
  const [showDropdown, setShowDropdown] = useState({});

  const days = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const meals = ["pranzo","cena"];

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('td')) {
        setShowDropdown({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Ascolta lo stato di autenticazione
  useEffect(() => {
    console.log("🔍 Inizializzazione auth listener...");
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("👤 User state changed:", currentUser?.email || "nessun utente");
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Aggiorna le ricette in tempo reale da Firestore
  useEffect(() => {
    const recipesCollection = collection(db, "recipes");
    const unsubscribe = onSnapshot(recipesCollection, snapshot => {
      const recs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(recs);
    });
    return unsubscribe;
  }, []);

  // Carica e ascolta il piano settimanale condiviso
  useEffect(() => {
    const mealPlanDoc = doc(db, "shared", "mealPlan");
    const unsubscribe = onSnapshot(mealPlanDoc, (docSnap) => {
      if (docSnap.exists()) {
        setMealPlan(docSnap.data().plan || {});
      }
    });
    return unsubscribe;
  }, []);

  // Carica e ascolta la lista della spesa condivisa
  useEffect(() => {
    const shoppingListDoc = doc(db, "shared", "shoppingList");
    const unsubscribe = onSnapshot(shoppingListDoc, (docSnap) => {
      if (docSnap.exists()) {
        setShoppingList(docSnap.data().items || []);
      }
    });
    return unsubscribe;
  }, []);

  // Aggiungi una nuova ricetta su Firestore
  const addRecipe = async (name, ingredients) => {
    const recipesCollection = collection(db, "recipes");
    await addDoc(recipesCollection, { name, ingredients });
  };

  // Salva il piano settimanale su Firestore
  const saveMealPlan = async (newPlan) => {
    const mealPlanDoc = doc(db, "shared", "mealPlan");
    await setDoc(mealPlanDoc, { plan: newPlan });
  };

  // Salva la lista della spesa su Firestore
  const saveShoppingList = async (newList) => {
    const shoppingListDoc = doc(db, "shared", "shoppingList");
    await setDoc(shoppingListDoc, { items: newList });
  };

  const handleChange = (day, meal, recipeId) => {
    const newPlan = {
      ...mealPlan,
      [day]: { ...mealPlan[day], [meal]: recipeId }
    };
    setMealPlan(newPlan);
    saveMealPlan(newPlan);
    setShowDropdown({});
    setSearchTerms(prev => ({ ...prev, [`${day}-${meal}`]: "" }));
  };

  const getFilteredRecipes = (day, meal) => {
    const searchTerm = searchTerms[`${day}-${meal}`] || "";
    if (!searchTerm) return recipes;
    return recipes.filter(r => 
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleSearchChange = (day, meal, value) => {
    setSearchTerms(prev => ({ ...prev, [`${day}-${meal}`]: value }));
    setShowDropdown(prev => ({ ...prev, [`${day}-${meal}`]: true }));
  };

  const getRecipeName = (recipeId) => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? recipe.name : "";
  };

  const generateShoppingList = () => {
    const list = new Set();
    for (const day of days) {
      for (const meal of meals) {
        const recipeId = mealPlan[day]?.[meal];
        if (!recipeId) continue;
        const recipe = recipes.find(r => r.id === recipeId);
        if (!recipe) continue;
        recipe.ingredients.forEach(i => list.add(i));
      }
    }
    const newList = Array.from(list);
    setShoppingList(newList);
    saveShoppingList(newList);
  };

  const clearShoppingList = () => {
    setShoppingList([]);
    saveShoppingList([]);
  };

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        setUser(user);
      }
    } catch (error) {
      console.error("Errore login:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ backgroundColor: "#D1E6DB", minHeight: "100vh", display:"flex", justifyContent:"center", alignItems:"center", fontFamily:"Arial, sans-serif" }}>
        <p style={{ fontSize: "18px" }}>Caricamento...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ backgroundColor: "#D1E6DB", minHeight: "100vh", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", fontFamily:"Arial, sans-serif", gap: "20px" }}>
        <h1 style={{ fontSize: "32px", margin: 0 }}>Meal Planner</h1>
        <button 
          onClick={handleLogin}
          style={{ 
            padding:"12px 24px", 
            fontSize:"18px", 
            borderRadius:"5px", 
            backgroundColor:"#2e7d32", 
            color:"white", 
            border:"none", 
            cursor:"pointer",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
        >
          Accedi con Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#D1E6DB", minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: "36px", marginBottom: "20px" }}>Meal Planner</h1>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        <div style={{ textAlign: "right" }}>
          <span style={{ marginRight: "15px", fontSize: "14px" }}>👤 {user.email}</span>
          <button onClick={handleLogout} style={{ padding:"6px 12px", borderRadius:"4px", backgroundColor:"#a12828", color:"white", border:"none", cursor:"pointer" }}>
            Logout
          </button>
        </div>

        <form style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
          onSubmit={e => {
            e.preventDefault();
            const name = e.target.elements.name.value.trim();
            const ingredients = e.target.elements.ingredients.value
              .split(",")
              .map(i => i.trim())
              .filter(i => i);
            if(!name || ingredients.length===0) return;
            addRecipe(name, ingredients);
            e.target.reset();
          }}
        >
          <input type="text" name="name" placeholder="Nome ricetta" required style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #aaa" }} />
          <input type="text" name="ingredients" placeholder="Ingredienti, separati da virgola" required style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #aaa" }} />
          <button type="submit" style={{ padding: "8px 16px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Aggiungi</button>
        </form>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #aaa", padding: "8px", backgroundColor: "#a5d6a7" }}>Giorno</th>
                {meals.map(meal => <th key={meal} style={{ border: "1px solid #aaa", padding: "8px", backgroundColor: "#a5d6a7" }}>{meal}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day}>
                  <td style={{ border: "1px solid #aaa", padding: "8px", fontWeight: "bold" }}>{day}</td>
                  {meals.map(meal => {
                    const key = `${day}-${meal}`;
                    const selectedRecipeId = mealPlan[day]?.[meal];
                    const filteredRecipes = getFilteredRecipes(day, meal);
                    const isDropdownOpen = showDropdown[key];
                    
                    return (
                      <td key={meal} style={{ border: "1px solid #aaa", padding: "8px", position: "relative" }}>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={selectedRecipeId ? getRecipeName(selectedRecipeId) : (searchTerms[key] || "")}
                            onChange={(e) => handleSearchChange(day, meal, e.target.value)}
                            onFocus={() => setShowDropdown(prev => ({ ...prev, [key]: true }))}
                            placeholder="Cerca ricetta..."
                            style={{ 
                              width: "100%", 
                              padding: "6px", 
                              borderRadius: "4px", 
                              border: "1px solid #aaa",
                              boxSizing: "border-box"
                            }}
                          />
                          
                          {selectedRecipeId && (
                            <button
                              onClick={() => handleChange(day, meal, "")}
                              style={{
                                position: "absolute",
                                right: "5px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "#a12828",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                cursor: "pointer",
                                fontSize: "12px",
                                lineHeight: "1",
                                padding: 0
                              }}
                            >
                              ×
                            </button>
                          )}
                          
                          {isDropdownOpen && !selectedRecipeId && filteredRecipes.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "1px solid #aaa",
                              borderRadius: "4px",
                              maxHeight: "200px",
                              overflowY: "auto",
                              zIndex: 1000,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                            }}>
                              {filteredRecipes.map(r => (
                                <div
                                  key={r.id}
                                  onClick={() => handleChange(day, meal, r.id)}
                                  style={{
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f0f0f0"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "white"}
                                >
                                  {r.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={generateShoppingList} style={{ padding: "10px 20px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Genera lista della spesa
          </button>

          <button onClick={clearShoppingList} style={{ padding: "10px 20px", backgroundColor: "#a12828", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Cancella lista
          </button>
        </div>

        {shoppingList.length > 0 && (
          <div style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", maxWidth: "500px", margin: "0 auto", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
            <h3 style={{ marginTop: 0, marginBottom: "15px", textAlign: "center" }}>🛒 Lista della spesa</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {shoppingList.map((item, i) => (
                <li key={i} style={{ padding: "8px 0", borderBottom: i < shoppingList.length - 1 ? "1px solid #eee" : "none" }}>
                  • {item}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;