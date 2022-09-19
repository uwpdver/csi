import React from 'react';

const MatchesHeader = ({ children = "" }: { children?: React.ReactNode }) => {
  return (
    <header className="mt-2 mx-4 mb-2 flex items-center justify-center">
      <div className="text-center truncate overflow-hidden">{children}</div>
    </header>
  )
}

export default MatchesHeader;