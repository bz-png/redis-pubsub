import { userInfo } from 'os';

import { ApolloClient, InMemoryCache, gql } from '@apollo/client/core';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import fetch from 'cross-fetch';

/** this module (.js) run as entry point `process.argv[1]` */
if (require.main === module) {
  main();
}

/** `main` function as application entry point */
async function main() {
  /** listen `unhandledRejection` and `throw` it into sync `Error` */
  process.on('unhandledRejection', err => {
    console.error('Unhandled Rejection at:', err);
  });

  /**
   * define a `Error.prototype.toJSON` to stringify the Error object
   * @see https://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
   */
  if (!('toJSON' in Error.prototype)) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(Error.prototype, 'toJSON', {
      value: function toJSON() {
        const alt: Record<string, unknown> = {};
        Object.getOwnPropertyNames(this).forEach(key => {
          alt[key] = this[key];
        });
        return alt;
      },
      configurable: true,
      writable: true,
    });
  }

  console.log('System information', {
    'process.pid': process.pid,
    'process.ppid': process.ppid,
    'process.platform': process.platform,
    'process.arch': process.arch,
    'process.versions': process.versions,
    'os.userInfo()': userInfo(),
  });

  await runApolloClient();
}

// =========================== Q U E R Y =============== //
function addFormulas(a: string, b: string) {
  const addFormulasQuery = gql`
    mutation {
      addFormulas(
        input: {
          formulas: [
            {
              operator: Add
              operandLKind: Variable
              operandLVar: "${a}"
              operandRKind: Variable
              operandRVar: "${b}"
            }
          ]
        }
      ) {
        formulas {
          id
        }
      }
    }
  `;
  return addFormulasQuery;
  // console.log(addFormulas)
}

function add(a: number, b: number, id: string) {
  const addQuery = gql`
    query {
        calculateFormula(
          id: "${id}"
          variables: { a: ${a}, b: ${b} }
        ) {
          result
          resultText
          formulaText
          variables
        }
      }
    `;
  return addQuery;
  // console.log(addFormulas)
}

function remove(id: string) {
  const addQuery = gql`
      mutation {
          removeFormulasByRoot(
            input: {
              id:"${id}"
            }
          ){
            removedCount
          }
        }
      `;
  return addQuery;
  // console.log(addFormulas)
}
// =====================================================//

async function runApolloClient() {
  const client = new ApolloClient({
    link: new BatchHttpLink({
      // uri: 'https://48p1r2roz4.sse.codesandbox.io',
      uri: 'http://localhost:20001/graphql',
      fetch,
    }),
    cache: new InMemoryCache(),
  });

  try {
    // Create Add Formula
    let data = addFormulas('a', 'b');
    let result = await client.mutate({
      mutation: data,
    });
    let json = JSON.stringify(result.data);
    let obj = JSON.parse(json);
    const id = obj.addFormulas.formulas[0].id;
    console.log('Add Formula created with id=', id);

    // Calculation
    data = add(1, 2, id);
    result = await client.query({
      query: data,
    });
    json = JSON.stringify(result.data);
    obj = JSON.parse(json);
    result = obj.calculateFormula.result;
    console.log('Calculation result = ', result);

    // remove formula
    data = remove(id);
    result = await client.mutate({
      mutation: data,
    });
    json = JSON.stringify(result.data);
    obj = JSON.parse(json);
    result = obj.removeFormulasByRoot.removedCount;
    if (result == 0) console.log('addFormula with id =', id, 'already removed');
    if (result == 1) console.log('addFormula with id =', id, 'removed');
  } catch (err) {
    console.error('runApolloClient error', err);
  }
}
