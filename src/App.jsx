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

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('td')) {
        setShowDropdown({});
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const recipesCollection = collection(db, "recipes");
    const unsubscribe = onSnapshot(recipesCollection, snapshot => {
      const recs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecipes(recs);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const mealPlanDoc = doc(db, "shared", "mealPlan");
    const unsubscribe = onSnapshot(mealPlanDoc, (docSnap) => {
      if (docSnap.exists()) {
        setMealPlan(docSnap.data().plan || {});
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const shoppingListDoc = doc(db, "shared", "shoppingList");
    const unsubscribe = onSnapshot(shoppingListDoc, (docSnap) => {
      if (docSnap.exists()) {
        setShoppingList(docSnap.data().items || []);
      }
    });
    return unsubscribe;
  }, []);

  const addRecipe = async (name, ingredients) => {
    const recipesCollection = collection(db, "recipes");
    await addDoc(recipesCollection, { name, ingredients });
  };

  const saveMealPlan = async (newPlan) => {
    const mealPlanDoc = doc(db, "shared", "mealPlan");
    await setDoc(mealPlanDoc, { plan: newPlan });
  };

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

  const copyToBring = () => {
    const bringFormat = shoppingList.join('\n');
    navigator.clipboard.writeText(bringFormat).then(() => {
      alert('✅ Lista copiata negli appunti!');
    }).catch(err => {
      alert('Copia questa lista:\n\n' + bringFormat);
    });
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
      <div style={{ 
        backgroundColor: "#D1E6DB", 
        minHeight: "100vh", 
        display:"flex", 
        justifyContent:"center", 
        alignItems:"center", 
        fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "15px" }}>🍽️</div>
          <p style={{ fontSize: "18px", color: "#2e7d32" }}>Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        backgroundColor: "#D1E6DB", 
        minHeight: "100vh", 
        display:"flex", 
        flexDirection:"column", 
        justifyContent:"center", 
        alignItems:"center", 
        fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", 
        gap: "30px",
        padding: "20px"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "80px", marginBottom: "20px" }}>🍽️</div>
          <h1 style={{ fontSize: "42px", margin: 0, color: "#2e7d32", fontWeight: "700", marginBottom: "10px" }}>
            Meal Planner
          </h1>
          <p style={{ fontSize: "18px", color: "#5a5a5a", margin: 0 }}>
            Pianifica i tuoi pasti settimanali
          </p>
        </div>
        <button 
          onClick={handleLogin}
          style={{ 
            padding:"16px 32px", 
            fontSize:"18px", 
            borderRadius:"12px", 
            backgroundColor:"#2e7d32", 
            color:"white", 
            border:"none", 
            cursor:"pointer",
            boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
            fontWeight: "600",
            transition: "all 0.3s ease",
            fontFamily:"'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 16px rgba(46, 125, 50, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(46, 125, 50, 0.3)";
          }}
        >
          🔐 Accedi con Google
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: "#D1E6DB", 
      minHeight: "100vh", 
      padding: "15px", 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" 
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ 
          background: "linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "clamp(24px, 5vw, 36px)", 
              margin: 0, 
              color: "white",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap"
            }}>
              🍽️ Meal Planner
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "rgba(255,255,255,0.9)", fontSize: "clamp(13px, 3vw, 16px)" }}>
              Piano settimanale condiviso
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ color: "white", fontSize: "clamp(13px, 3vw, 15px)", fontWeight: "500" }}>
              👤 {user.email.split('@')[0]}
            </span>
            <button 
              onClick={handleLogout} 
              style={{ 
                padding:"8px 16px", 
                borderRadius:"10px", 
                backgroundColor:"rgba(255,255,255,0.2)", 
                color:"white", 
                border:"1px solid rgba(255,255,255,0.3)", 
                cursor:"pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "rgba(255,255,255,0.2)";
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Form aggiungi ricetta - Card style */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "16px", 
          padding: "20px", 
          marginBottom: "20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)"
        }}>
          <h2 style={{ margin: "0 0 15px 0", fontSize: "clamp(18px, 4vw, 22px)", color: "#2e7d32", fontWeight: "600" }}>
            ➕ Aggiungi nuova ricetta
          </h2>
          <form style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            onSubmit={e => {
              e.preventDefault();
              const name = e.target.elements.name.value.trim();
              const ingredients = e.target.elements.ingredients.value
                .split(",")
                .map(i => i.trim())
                .filter(i => i);
              if(!name) return;
              addRecipe(name, ingredients.length > 0 ? ingredients : []);
              e.target.reset();
            }}
          >
            <input 
              type="text" 
              name="name" 
              placeholder="Nome ricetta" 
              required 
              style={{ 
                width: "100%",
                padding: "12px 16px", 
                borderRadius: "10px", 
                border: "2px solid #e0e0e0",
                fontSize: "15px",
                boxSizing: "border-box",
                transition: "border 0.3s ease"
              }} 
              onFocus={(e) => e.target.style.border = "2px solid #2e7d32"}
              onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
            />
            <input 
              type="text" 
              name="ingredients" 
              placeholder="Ingredienti (opzionale)" 
              style={{ 
                width: "100%",
                padding: "12px 16px", 
                borderRadius: "10px", 
                border: "2px solid #e0e0e0",
                fontSize: "15px",
                boxSizing: "border-box",
                transition: "border 0.3s ease"
              }} 
              onFocus={(e) => e.target.style.border = "2px solid #2e7d32"}
              onBlur={(e) => e.target.style.border = "2px solid #e0e0e0"}
            />
            <button 
              type="submit" 
              style={{ 
                width: "100%",
                padding: "12px 28px", 
                backgroundColor: "#2e7d32", 
                color: "white", 
                border: "none", 
                borderRadius: "10px", 
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                boxShadow: "0 2px 8px rgba(46, 125, 50, 0.3)",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = "#388e3c";
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = "#2e7d32";
              }}
            >
              Aggiungi
            </button>
          </form>
        </div>

        {/* Tabella piano settimanale - Card style */}
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "16px", 
          padding: "15px", 
          marginBottom: "20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          overflowX: "auto"
        }}>
          <h2 style={{ margin: "0 0 15px 0", fontSize: "clamp(18px, 4vw, 22px)", color: "#2e7d32", fontWeight: "600" }}>
            📅 Piano settimanale
          </h2>
          <table style={{ width: "100%", minWidth: "600px", borderCollapse: "separate", borderSpacing: 0, textAlign: "center" }}>
            <thead>
              <tr>
                <th style={{ 
                  padding: "12px 8px", 
                  backgroundColor: "#f1f8f4", 
                  fontWeight: "600",
                  color: "#2e7d32",
                  borderTopLeftRadius: "10px",
                  fontSize: "clamp(13px, 3vw, 15px)"
                }}>
                  Giorno
                </th>
                {meals.map((meal, idx) => (
                  <th key={meal} style={{ 
                    padding: "12px 8px", 
                    backgroundColor: "#f1f8f4", 
                    fontWeight: "600",
                    color: "#2e7d32",
                    borderTopRightRadius: idx === meals.length - 1 ? "10px" : "0",
                    fontSize: "clamp(13px, 3vw, 15px)",
                    textTransform: "capitalize"
                  }}>
                    <span style={{ display: "inline-block" }}>
                      {meal === "pranzo" ? "🍝" : "🌙"}
                    </span>
                    <span style={{ display: "inline-block", marginLeft: "4px" }}>
                      {meal}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, dayIdx) => (
                <tr key={day}>
                  <td style={{ 
                    padding: "10px 8px", 
                    fontWeight: "600", 
                    backgroundColor: "#fafafa",
                    color: "#424242",
                    borderLeft: "3px solid #2e7d32",
                    fontSize: "clamp(12px, 3vw, 14px)"
                  }}>
                    {day}
                  </td>
                  {meals.map(meal => {
                    const key = `${day}-${meal}`;
                    const selectedRecipeId = mealPlan[day]?.[meal];
                    const filteredRecipes = getFilteredRecipes(day, meal);
                    const isDropdownOpen = showDropdown[key];
                    
                    return (
                      <td key={meal} style={{ 
                        padding: "10px 8px", 
                        position: "relative",
                        backgroundColor: "white",
                        borderBottom: dayIdx === days.length - 1 ? "none" : "1px solid #f0f0f0"
                      }}>
                        <div style={{ position: "relative" }}>
                          <input
                            type="text"
                            value={selectedRecipeId ? getRecipeName(selectedRecipeId) : (searchTerms[key] || "")}
                            onChange={(e) => handleSearchChange(day, meal, e.target.value)}
                            onFocus={() => setShowDropdown(prev => ({ ...prev, [key]: true }))}
                            placeholder="Cerca..."
                            style={{ 
                              width: "100%", 
                              padding: "8px 10px", 
                              borderRadius: "8px", 
                              border: "2px solid #e8f5e9",
                              boxSizing: "border-box",
                              fontSize: "clamp(12px, 3vw, 14px)",
                              transition: "all 0.3s ease"
                            }}
                            onMouseEnter={(e) => e.target.style.borderColor = "#c8e6c9"}
                            onMouseLeave={(e) => {
                              if (document.activeElement !== e.target) {
                                e.target.style.borderColor = "#e8f5e9";
                              }
                            }}
                          />
                          
                          {selectedRecipeId && (
                            <button
                              onClick={() => handleChange(day, meal, "")}
                              style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "#ef5350",
                                color: "white",
                                border: "none",
                                borderRadius: "50%",
                                width: "22px",
                                height: "22px",
                                cursor: "pointer",
                                fontSize: "14px",
                                lineHeight: "1",
                                padding: 0,
                                fontWeight: "bold",
                                transition: "all 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#d32f2f";
                                e.target.style.transform = "translateY(-50%) scale(1.1)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#ef5350";
                                e.target.style.transform = "translateY(-50%) scale(1)";
                              }}
                            >
                              ×
                            </button>
                          )}
                          
                          {isDropdownOpen && !selectedRecipeId && filteredRecipes.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "calc(100% + 5px)",
                              left: 0,
                              right: 0,
                              backgroundColor: "white",
                              border: "2px solid #e8f5e9",
                              borderRadius: "10px",
                              maxHeight: "250px",
                              overflowY: "auto",
                              zIndex: 1000,
                              boxShadow: "0 6px 20px rgba(0,0,0,0.15)"
                            }}>
                              {filteredRecipes.map(r => (
                                <div
                                  key={r.id}
                                  onClick={() => handleChange(day, meal, r.id)}
                                  style={{
                                    padding: "12px 16px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f5f5f5",
                                    fontSize: "14px",
                                    transition: "background-color 0.2s ease"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f8f4"}
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

        {/* Bottoni lista della spesa */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          <button 
            onClick={generateShoppingList} 
            style={{ 
              width: "100%",
              padding: "14px 20px", 
              backgroundColor: "#2e7d32", 
              color: "white", 
              border: "none", 
              borderRadius: "12px", 
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "clamp(14px, 3.5vw, 16px)",
              boxShadow: "0 4px 12px rgba(46, 125, 50, 0.3)",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#388e3c";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "#2e7d32";
            }}
          >
            🛒 Genera lista della spesa
          </button>

          {shoppingList.length > 0 && (
            <>
              <button 
                onClick={copyToBring} 
                style={{ 
                  width: "100%",
                  padding: "14px 20px", 
                  backgroundColor: "#1976d2", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "12px", 
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "clamp(14px, 3.5vw, 16px)",
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#1565c0";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#1976d2";
                }}
              >
                📋 Copia lista
              </button>

              <button 
                onClick={clearShoppingList} 
                style={{ 
                  width: "100%",
                  padding: "14px 20px", 
                  backgroundColor: "#ef5350", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "12px", 
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "clamp(14px, 3.5vw, 16px)",
                  boxShadow: "0 4px 12px rgba(239, 83, 80, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#d32f2f";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#ef5350";
                }}
              >
                🗑️ Cancella lista
              </button>
            </>
          )}
        </div>

        {/* Lista della spesa - Card style migliorata */}
        {shoppingList.length > 0 && (
          <div style={{ 
            backgroundColor: "white", 
            padding: "20px", 
            borderRadius: "16px", 
            margin: "0 auto", 
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}>
            <h3 style={{ 
              marginTop: 0, 
              marginBottom: "20px", 
              textAlign: "center",
              fontSize: "clamp(20px, 5vw, 24px)",
              color: "#2e7d32",
              fontWeight: "700"
            }}>
              🛒 Lista della spesa
            </h3>
            <div style={{ 
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: "10px"
            }}>
              {shoppingList.map((item, i) => (
                <div
                  key={i}
                  style={{ 
                    padding: "10px 14px",
                    backgroundColor: "#f1f8f4",
                    borderRadius: "10px",
                    fontSize: "clamp(13px, 3vw, 15px)",
                    color: "#2e7d32",
                    fontWeight: "500",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    wordBreak: "break-word"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8f5e9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f1f8f4";
                  }}
                >
                  • {item}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;