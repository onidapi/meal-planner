import { useState, useEffect } from "react";
import { db } from "./firebase";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { auth, loginWithGoogle, logout, handleRedirectResult } from "./firebaseAuth";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [mealPlan, setMealPlan] = useState({});
  const [shoppingList, setShoppingList] = useState([]);
  const [user, setUser] = useState(null);

  const days = ["Lunedì","Martedì","Mercoledì","Giovedì","Venerdì","Sabato","Domenica"];
  const meals = ["pranzo","cena"];

  // Recupera utente dopo redirect
  useEffect(() => {
    handleRedirectResult().then(u => {
      if (u) setUser(u);
    });
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

  // Aggiungi una nuova ricetta su Firestore
  const addRecipe = async (name, ingredients) => {
    const recipesCollection = collection(db, "recipes");
    await addDoc(recipesCollection, { name, ingredients });
  };

  const handleChange = (day, meal, recipeId) => {
    setMealPlan(prev => ({
      ...prev,
      [day]: { ...prev[day], [meal]: recipeId }
    }));
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
    setShoppingList(Array.from(list));
  };

  if (!user) {
    // Pagina login
    return (
      <div style={{ backgroundColor: "#D1E6DB", minHeight: "100vh", display:"flex", justifyContent:"center", alignItems:"center", fontFamily:"Arial, sans-serif" }}>
        <button onClick={loginWithGoogle} style={{ padding:"10px 20px", fontSize:"18px", borderRadius:"5px", backgroundColor:"#2e7d32", color:"white", border:"none", cursor:"pointer" }}>
          Accedi con Google
        </button>
      </div>
    );
  }

  // Pagina principale
  return (
    <div style={{ backgroundColor: "#D1E6DB", minHeight: "100vh", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", fontSize: "36px", marginBottom: "20px" }}>Meal Planner</h1>
      <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>

        {/* Logout */}
        <div style={{ textAlign: "right" }}>
          <button onClick={() => { logout(); setUser(null); }} style={{ padding:"6px 12px", borderRadius:"4px", backgroundColor:"#a12828", color:"white", border:"none", cursor:"pointer" }}>
            Logout
          </button>
        </div>

        {/* Form aggiungi ricetta */}
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

        {/* Tabella piano settimanale */}
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
                  {meals.map(meal => (
                    <td key={meal} style={{ border: "1px solid #aaa", padding: "8px" }}>
                      <select value={mealPlan[day]?.[meal] || ""} onChange={e => handleChange(day, meal, e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #aaa", width: "100%" }}>
                        <option value="">-- scegli --</option>
                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottoni lista della spesa */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={generateShoppingList} style={{ padding: "10px 20px", backgroundColor: "#2e7d32", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Genera lista della spesa
          </button>

          <button onClick={() => setShoppingList([])} style={{ padding: "10px 20px", backgroundColor: "#a12828", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Cancella lista
          </button>
        </div>

        {/* Lista della spesa */}
        {shoppingList.length > 0 && (
          <ul style={{ backgroundColor: "white", padding: "15px", borderRadius: "6px", maxWidth: "500px", margin: "0 auto", listStyle: "none", boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}>
            {shoppingList.map((item, i) => <li key={i} style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}>{item}</li>)}
          </ul>
        )}

      </div>
    </div>
  );
}

export default App;
