import { Prisma } from "@prisma/client";
import prisma from "@database";

export const createPlanta = async (data: Prisma.PlantaCreateInput) => {
    return await prisma.planta.create({ data: data });
};

export const findAllPlantas = async (where: Prisma.PlantaWhereInput) => {
    return await prisma.planta.findMany({ where: where });
};

export const findPlantaById = async (id: number) => {
    return await prisma.planta.findUnique({ where: { id: id } });
};

export const updatePlanta = async (id: number, data: Prisma.PlantaUpdateInput) => {
    return await prisma.planta.update({ where: { id: id }, data: data });
};

export const deletePlanta = async (id: number) => {
    return await prisma.planta.delete({ where: { id: id } });
};

// Venda: só diminui se houver estoque suficiente, tudo numa única operação.
// Retorna quantas linhas foram alteradas (1 = vendeu, 0 = estoque insuficiente).
export const sellPlanta = async (id: number, quantidade: number) => {
    const result = await prisma.planta.updateMany({
        where: { id: id, estoque: { gte: quantidade } },
        data: { estoque: { decrement: quantidade } },
    });
    return result.count;
};

export const findAllPrecoEstoque = async () => {
    return await prisma.planta.findMany({
        select: { preco: true, estoque: true },
    });
};