import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-800 text-white text-center p-4 mt-8">
      <p>© {new Date().getFullYear()} MatchUp | All Rights Reserved</p>
    </footer>
  );
}

export default Footer;
