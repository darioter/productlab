import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>ProductLab — Sistema de E-Commerce</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="ProductLab — Research, decisión de compra y plan de acción para e-commerce" />
      </Head>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        iframe { border: none; width: 100%; height: 100vh; display: block; }
      `}</style>
      <iframe src="/app.html" title="ProductLab App" />
    </>
  );
}
