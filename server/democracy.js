let activeElection = {};

const getVoteCounts = election=>{
  const voteCounts = {};
  Object
    .keys(election)
    .forEach(voterID=>{
      const candidate = election[voterID];
      if( voteCounts[candidate] === undefined ){
        voteCounts[candidate] = 0;
      }
      voteCounts[candidate] ++;
    });
  return voteCounts;
};

const getWinner = voteCounts=>{
  let maxCandidate;
  let maxCandidateScore = 0;
  Object
    .keys(voteCounts)
    .forEach(candidate=>{
      const score = voteCounts[candidate];
      if(score > maxCandidateScore){
        maxCandidateScore = score;
        maxCandidate = candidate;
      }
    });
  return maxCandidate;
};

module.exports = {
  vote : (id, candidate)=>{
    activeElection[id] = candidate;
  },
  complete : ()=>{
    const voteCounts = getVoteCounts( activeElection );
    const winner = getWinner( voteCounts );
    activeElection = {};
    return {
      voteCounts,
      winner
    };
  }
};