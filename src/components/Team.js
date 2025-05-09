import React from 'react';

const Team = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Utkarsh Srivastava',
      role: 'Blockchain Developer',
      description: 'Blockchain enthusiast specializing in smart contract development and dApp architecture. Experienced in Solidity and Ethereum-based applications.'
    },
    {
      id: 2,
      name: 'Gaurav Pandey',
      role: 'Frontend Developer',
      description: 'Expert in React and web3 integration with a passion for creating intuitive user interfaces. Skilled in modern JavaScript frameworks and responsive design.'
    },
    {
      id: 3,
      name: 'Amit Kumar Singh',
      role: 'Backend Developer',
      description: 'Specialized in server-side architecture and blockchain integration for decentralized applications. Proficient in API development and database management.'
    }
  ];

  return (
    <div className="team-section">
      <div className="team-container">
        <h2 className="team-title">Our Team</h2>
        <p className="team-subtitle">Meet the talented developers behind Real Estate Dapp</p>
        
        <div className="team-members">
          {teamMembers.map(member => (
            <div className="team-member" key={member.id}>
              <div className="team-member-info">
                <h3>{member.name}</h3>
                <h4>{member.role}</h4>
                <p>{member.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
