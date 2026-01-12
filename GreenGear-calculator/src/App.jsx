import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Outlet, Link } from "react-router-dom";
import Calculator from "./Calculator";
import SavedResults from "./SavedResults";
import Login from "./Login";
import MaterialsView from "./MaterialsView";
import MaterialEnvironmentDataView from "./MaterialEnvironmentDataView";
import UserProfile from "./components/UserProfile";
import "./App.css";
import { useAuth } from "./auth/AuthProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
/**
 * App funktion tarkoitus on luoda navigointi ja reititys sovellukselle
 * Linkit eri näkymille löytyvät navigointipalkista
 *
 */
export default function App() {


    return (
        <BrowserRouter>
            <div>
                <div className="topnav">
                    <nav>

                    </nav>
                </div>

                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
                    <Route path="/materials" element={<ProtectedRoute><MaterialsView /></ProtectedRoute>} />
                    <Route path="/materials/:materialId/datasets" element={<ProtectedRoute><MaterialEnvironmentDataView /></ProtectedRoute>} />
                    <Route path="/" element={<ProtectedRoute><Calculator /></ProtectedRoute>} />
                    <Route path="/saved-results" element={<ProtectedRoute><SavedResults /></ProtectedRoute>} />
                </Routes>
                <Outlet />
            </div>
        </BrowserRouter>
    );
}

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(<App />);