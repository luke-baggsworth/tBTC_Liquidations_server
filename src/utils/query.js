const { gql } = require('@apollo/client/core');

const depositQuery = `
  subscription GetDeposits {
    deposits(first: 1000) {
      id
      contractAddress
      currentState
      bondedECDSAKeep {
        id
        totalBondAmount
        createdAt
        members {
          id,
          address
        }
      }
      lotSizeSatoshis
      initialCollateralizedPercent
      undercollateralizedThresholdPercent
      severelyUndercollateralizedThresholdPercent
    }
  }
`;

const priceQuery = `
  subscription GetPrice {
    price(id: "0x81a679f98b63b3ddf2f17cb5619f4d6775b3c5ed") {
      val,
      timestamp,
      blockNumber,
      transactionHash
    }
  }
`;

const operatorQuery = gql`
  query GetOperator($id: ID!) {
      operator(id: $id) {
          id,
          address,
          bonded,
          unboundAvailable,
          stakedAmount,
          totalFaultCount,
          attributableFaultCount,
          keeps(first: 300, orderBy: createdAt, orderDirection: desc) {
              id,
              deposit {
                  id,
                  contractAddress,
                  lotSizeSatoshis,
                  currentState,
                  createdAt,
                  bondedECDSAKeep {
                      id,
                      totalBondAmount
                  },
              }
          }
      }
  }
`

module.exports = { depositQuery, priceQuery, operatorQuery };